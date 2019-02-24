let Jasmine = require('jasmine');
let JasmineTSConsoleReporter = require('jasmine-ts-console-reporter');

let jasmine = new Jasmine();

jasmine.clearReporters(); // Clear default console reporter
jasmine.addReporter(new JasmineTSConsoleReporter());

jasmine.showColors(true);
jasmine.loadConfigFile('jasmine.config.json');
jasmine.execute();
