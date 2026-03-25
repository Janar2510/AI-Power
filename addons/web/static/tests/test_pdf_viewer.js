(function () {
  var H = window.TestHelpers;
  var Pdf = window.UIComponents && window.UIComponents.PdfViewer;

  function run() {
    var results = { pass: 0, fail: 0, errors: [] };
    function test(name, fn) {
      try {
        fn();
        results.pass += 1;
      } catch (e) {
        results.fail += 1;
        results.errors.push(name + ": " + e.message);
      }
    }

    test("pdf viewer opens and closes with API", function () {
      H.assertTrue(!!Pdf && typeof Pdf.open === "function");
      var handle = Pdf.open("/report/pdf/dummy/1", "Test");
      H.assertTrue(!!handle && typeof handle.close === "function");
      H.assertTrue(!!document.querySelector(".o-report-preview"));
      handle.close();
      H.assertFalse(!!document.querySelector(".o-report-preview"));
    });

    test("pdf viewer dialog has close control", function () {
      Pdf.open("/report/pdf/dummy/2", "T2");
      var btn = document.querySelector(".o-report-preview-close");
      H.assertTrue(!!btn);
      btn.click();
      H.assertFalse(!!document.querySelector(".o-report-preview"));
    });

    return Promise.resolve(results);
  }

  window.Tests = window.Tests || {};
  window.Tests.pdf_viewer = run;
})();
