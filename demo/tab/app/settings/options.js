// https://github.com/fent/chrome-options

cas_companion.options.opts.about = "<b>CAS Companion</b><br>";
cas_companion.options.opts.autoSave = true;
cas_companion.options.opts.saveDefaults = true;

cas_companion.options.addTab('General', [
    { name: 'cas_enabled', desc: 'Enables CAS Service' },
    { name: 'cas_server_url', 'default': 'http://localhost', type: 'text', desc: 'The url for CAS Service', singleline: true },
    { name: 'cas_server_token', 'default': 'cCWcsOsxprO2BhnUnondjSqBLzPk1dCFf4Bb24JE', type: 'text', desc: 'The CAS access token assigned', singleline: true },

]);

