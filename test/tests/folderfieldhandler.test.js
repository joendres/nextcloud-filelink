// SPDX-FileCopyrightText: 2022 - 2023 Johannes Endres
//
// SPDX-License-Identifier: MIT

import { FolderFieldHandler } from "../../src/management/folderfieldhandler.js";
const expect = chai.expect;

describe("FolderFieldHandler", () => {
    describe("preCloudUpdate", () => {
        afterEach(sinon.restore);

        it("adds a missing / at the start", () => {
            const node = { value: "path" };
            sinon.stub(document, "querySelector").returns(node);

            FolderFieldHandler.preCloudUpdate();

            expect(node.value).to.equal("/path");
        });
        it("removes a / at the end", () => {
            const node = { value: "/path/" };
            sinon.stub(document, "querySelector").returns(node);

            FolderFieldHandler.preCloudUpdate();

            expect(node.value).to.equal("/path");
        });
        it("removes a sequence of / at the end", () => {
            const node = { value: "/path///" };
            sinon.stub(document, "querySelector").returns(node);

            FolderFieldHandler.preCloudUpdate();

            expect(node.value).to.equal("/path");
        });
        it("replaces a sequence of / at the start with only one", () => {
            const node = { value: "///path" };
            sinon.stub(document, "querySelector").returns(node);

            FolderFieldHandler.preCloudUpdate();

            expect(node.value).to.equal("/path");
        });
        it("replaces a sequence of / at in the path with only one", () => {
            const node = { value: "/path///to" };
            sinon.stub(document, "querySelector").returns(node);

            FolderFieldHandler.preCloudUpdate();

            expect(node.value).to.equal("/path/to");
        });
        it("leaves dots untouched", () => {
            const node = { value: "/path/../up/./same" };
            sinon.stub(document, "querySelector").returns(node);

            FolderFieldHandler.preCloudUpdate();

            expect(node.value).to.equal("/path/../up/./same");
        });
    });
});