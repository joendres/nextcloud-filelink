class TBVersionWorkarounds {
    static async apply_all() {
        TBVersionWorkarounds.workaroundRedefinedManifestKeys();
    }

    /**
     * In TB 78.6.1 the meaning of the manifest key compose_action.default_title was
     * changed: Before it was the label shown in the butteon, afterwards it's the
     * tooltip for the button. This function puts the default_label into the button
     * in older versions of TB, that interpret default_title the old way.
     */
    static async workaroundRedefinedManifestKeys() {
        // setLabel was introduced in the same changeset
        if (!messenger.composeAction.setLabel) {
            const manifest = browser.runtime.getManifest();
            if (manifest.compose_action && manifest.compose_action.default_label) {
                messenger.composeAction.setTitle({
                    title: Localize.localizeMSGString(manifest.compose_action.default_label),
                });
            }
        }
    }
}

/* exported TBVersionWorkarounds */
/* global Localize */