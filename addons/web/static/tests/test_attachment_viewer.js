(function () {
  var H = window.TestHelpers;
  var Viewer = window.UIComponents && window.UIComponents.AttachmentViewer;

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

    test("attachment viewer exists", function () {
      H.assertTrue(!!Viewer);
      H.assertTrue(typeof Viewer.open === "function");
    });

    test("attachment viewer mounts and closes", function () {
      var modal = Viewer.open([{ name: "Image", url: "data:image/png;base64,iVBORw0KGgo=", mimetype: "image/png" }], 0);
      H.assertTrue(!!document.querySelector(".o-attachment-viewer"));
      H.assertTrue(!!modal && typeof modal.close === "function");
      modal.close();
      H.assertFalse(!!document.querySelector(".o-attachment-viewer"));
    });

    return Promise.resolve(results);
  }

  window.Tests = window.Tests || {};
  window.Tests.attachment_viewer = run;
})();
