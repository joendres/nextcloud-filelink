// SPDX-FileCopyrightText: 2019-2023 Johannes Endres
//
// SPDX-License-Identifier: MIT

export const Statuses = Object.freeze({
    CHECKINGSPACE: "checkingspace",
    CREATING: "creating",
    GENERATEDPASSWORD: "generatedpassword",
    MOVING: "moving",
    PREPARING: "preparing",
    SHARING: "sharing",
    UPLOADING: "uploading",
});

/* Make sure, that for every string a corresponding status_... string is defined in _locales */