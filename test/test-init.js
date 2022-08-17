mocha.setup({ ui: "bdd", globals: ["browser"] });
mocha.checkLeaks();
var expect = chai.expect;
