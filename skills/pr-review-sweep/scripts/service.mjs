#!/usr/bin/env node
import { mkdir, realpath, rename, symlink, unlink, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { command, laptopOpen, loadConfig, SKILL_ROOT } from './watcher.mjs'

export const LABEL = 'com.thiamine.pr-review-sweep'
const xml = (value) =>
	String(value)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;')
const string = (value) => `<string>${xml(value)}</string>`

export function plist({ nodePath, scriptPath, configPath, stateDirectory, pathEnvironment }) {
	return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Label</key>${string(LABEL)}
<key>ProgramArguments</key><array>${[nodePath, scriptPath, 'once', '--scheduled', '--config', configPath].map(string).join('')}</array>
<key>WorkingDirectory</key>${string(SKILL_ROOT)}
<key>EnvironmentVariables</key><dict><key>PATH</key>${string(pathEnvironment)}</dict>
<key>RunAtLoad</key><true/>
<key>StartCalendarInterval</key><array>${[0, 15, 30, 45].map((minute) => `<dict><key>Minute</key><integer>${minute}</integer></dict>`).join('')}</array>
<key>ProcessType</key><string>Background</string>
<key>ExitTimeOut</key><integer>30</integer>
<key>StandardOutPath</key>${string(join(stateDirectory, 'launchd.stdout.log'))}
<key>StandardErrorPath</key>${string(join(stateDirectory, 'launchd.stderr.log'))}
</dict></plist>
`
}

async function bootout(domain) {
	try {
		await command('/bin/launchctl', ['bootout', `${domain}/${LABEL}`])
	} catch (error) {
		if (!/exited 3:|No such process|Could not find service/i.test(error.message)) throw error
	}
}

export async function service(action, configPath) {
	if (process.platform !== 'darwin') throw new Error('This watcher service uses macOS launchd')
	const config = await loadConfig(configPath)
	const domain = `gui/${process.getuid()}`
	const destination = join(homedir(), 'Library', 'LaunchAgents', `${LABEL}.plist`)
	if (action === 'status') return command('/bin/launchctl', ['print', `${domain}/${LABEL}`])
	if (action === 'uninstall') {
		await bootout(domain)
		await unlink(destination).catch((error) => {
			if (error.code !== 'ENOENT') throw error
		})
		return 'Watcher stopped; skill, queue, and evidence retained.'
	}
	if (action !== 'install') throw new Error('Use install, status, or uninstall')
	await command(config.codexPath, ['--version'])
	if (JSON.parse(await command(config.ghPath, ['api', 'user'])).login !== config.actor)
		throw new Error('GitHub actor mismatch')
	await laptopOpen(config)
	const nodePath = await realpath(process.execPath)
	const skillLink = join(
		process.env.CODEX_HOME ?? join(homedir(), '.codex'),
		'skills',
		'pr-review-sweep',
	)
	await mkdir(dirname(skillLink), { recursive: true })
	try {
		await symlink(SKILL_ROOT, skillLink, 'dir')
	} catch (error) {
		if (error.code !== 'EEXIST') throw error
		if ((await realpath(skillLink)) !== (await realpath(SKILL_ROOT)))
			throw new Error(`Existing skill at ${skillLink} points elsewhere`)
	}
	await mkdir(dirname(destination), { recursive: true })
	await mkdir(config.stateDirectory, { recursive: true })
	const temp = `${destination}.${process.pid}.tmp`
	await writeFile(
		temp,
		plist({
			nodePath,
			scriptPath: join(SKILL_ROOT, 'scripts', 'watcher.mjs'),
			configPath: resolve(configPath),
			stateDirectory: config.stateDirectory,
			pathEnvironment: `${dirname(nodePath)}:${join(homedir(), '.local', 'bin')}:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`,
		}),
		{ mode: 0o644 },
	)
	await command('/usr/bin/plutil', ['-lint', temp])
	await bootout(domain)
	await rename(temp, destination)
	await command('/bin/launchctl', ['enable', `${domain}/${LABEL}`])
	await command('/bin/launchctl', ['bootstrap', domain, destination])
	return {
		installed: true,
		skillLink,
		plist: destination,
		cadence: 'Once daily while lid is open; checks every 15 minutes and after wake.',
	}
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
	const args = process.argv.slice(2)
	const index = args.indexOf('--config')
	service(args[0] ?? 'status', index < 0 ? join(SKILL_ROOT, 'config.json') : args[index + 1])
		.then((value) =>
			console.log(typeof value === 'string' ? value : JSON.stringify(value, null, 2)),
		)
		.catch((error) => {
			console.error(error.message)
			process.exitCode = 1
		})
}
