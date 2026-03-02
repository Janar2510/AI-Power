{
    "name": "Web",
    "version": "1.0",
    "category": "Hidden",
    "description": "Web client core module.",
    "depends": ["base"],
    "data": [
        "views/webclient_templates.xml",
    ],
    "assets": {
        "web.assets_web": [
            "web/static/src/scss/webclient.css",
            "web/static/src/services/rpc.js",
            "web/static/src/services/session.js",
            "web/static/src/services/action.js",
            "web/static/src/services/i18n.js",
            "web/static/src/services/registry.js",
            "web/static/src/services/views.js",
            "web/static/src/views/list_renderer.js",
            "web/static/src/views/form_renderer.js",
            "web/static/src/views/modifier_eval.js",
            "web/static/src/main.js",
        ],
    },
    "installable": True,
    "auto_install": True,
}
