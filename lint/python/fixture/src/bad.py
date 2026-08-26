"""Fixture that must fail. Each line below trips a named rule."""

import os
import pickle


def load(path, items=[]):  # ANN, B006
    os.system("echo " + path)  # TID251, S605
    if type(items) == list:  # E721
        print("checking")  # T201
    # legacy = compute_legacy(path)
    try:
        return pickle.loads(open(path, "rb").read())  # TID251, S301, PTH123
    except:  # E722
        raise Exception("failed")  # TRY002, EM101, B904
