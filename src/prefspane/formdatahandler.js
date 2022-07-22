class FormDataHandler {

    /**
     * @param {Form} form The form to handle
     * @param {string} accountId The ID of the account as supplied by TB
     */
    constructor(form, accountId) {
        this.form = form;
        this.cc = new CloudConnection(accountId);
    }

    async load() {
        await this.cc.load();

        this.form.querySelectorAll("input")
            .forEach(input => {
                if (input.type === "checkbox" || input.type === "radio") {
                    input.checked = !!this.cc[input.id];
                } else if (this.cc[input.id]) {
                    input.value = this.cc[input.id];
                }
            });
    }
}

/* global CloudConnection */
/* exported FormDataHandler */