var expect = require("chai").expect;
var util = require("../lib/util.js");

describe("Utility", function () {
  describe("#extractTheNumber()", function () {
    it("should remove html tags", function () {
      var testString = "<sometag>123</sometag>";
      var results = util.extractTheNumber(testString);

      expect(results).to.equal(123.0);
    });
    it("should remove html tags, including numbers in styles", function () {
      var testString = "<sometag width='1' height='2'>560</sometag>";
      var results = util.extractTheNumber(testString);

      expect(results).to.equal(560.0);
    });
  });
});
