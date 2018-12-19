#!/usr/bin/node --harmony 

/*
 * ----------------------------------------------------------------------------
 * "THE BEER-WARE LICENSE" (Revision 42):
 * <rawbone@dysternis.de> wrote this file.  As long as you retain this notice you
 * can do whatever you want with this stuff. If we meet some day, and you think
 * this stuff is worth it, you can buy me a beer in return.   Thomas Mellenthin
 * ----------------------------------------------------------------------------
 */

// npm install request-digest semaphore
'use strict';


var program = require('commander');
program
  .version('0.1.0')
  .option('-o, --openhab "[OID URL]"', 'Posts the value of the given OID to the openHAB URL.')
  .option('-l, --list', 'List all known OIDs')
  .option('-f, --fetch [OIDs]', 'Fetches values for the given OIDs. OIDs must be submitted comma separated without spaces.')

program.on('--help', function(){
  console.log('')
  console.log('Examples:');
  console.log('')
  console.log('  Fetch the value of 1/60/0/155/1 and post the value to openHAB running at 192.168.23.42:');
  console.log('')
  console.log('  $ rawbone -o "1/60/0/155/1 http://192.168.23.42:8080/foo/bar/X"');
  console.log('')
  console.log('  Fetch the given OIDs and print the values and a description of each value on the console');
  console.log('')
  console.log('  $ rawbone -f 1/60/0/155/1,1/65/0/155/1,1/65/0/156/6');
});
program.parse(process.argv);

var config = require('./config');
var PATH="/api/1.0/lookup/";

const OIDs = {
  // 60 BioWIN II
    // 0 BioWIN-II
      // 155 Titelbild
      '1/60/0/155/0': 'Kesseltemperatur Istwert                    ',
      /**
       * Betriebsphasen 1/60/0/155/1
       *
       * 0: Brenner gesperrt
       * 1: Selbsttest
       * 2: WE ausschalten
       * 3: Standby
       * 4: Brenner AUS
       * 5: Vorspülen
       * 6: Zündphase
       * 7: Flammenstabilisierung
       * 8: Modulationsbetrieb
       * 17: Ausbrand
       */
      '1/60/0/155/1': 'Betriebsphasen BioWIN-II                    ',
      '1/60/0/155/2': 'Handbetrieb Solltemperatur                  ',
      /**
       * Betriebsarten 1/60/0/155/3
       *
       * 0: Ausgeschaltet
       * 1: Abschaltvorgang
       * 2: Festbrennstoff-/ Pufferbetrieb
       * 3: Pelletszuführung in Betrieb
       * 4: Pelletszuführung
       * 5: Ein
       * 6: Pelletszuführung in Betrieb
       * 7: Pelletszuführung
       * 8: Handbetrieb
       * 9: Kaminkehrfunktion
       * 10: Aktorentest
       * 11: Installationsvorgang aktiv
       */
      '1/60/0/155/3': 'Betriebsarten BioWIN-II                     ',
      '1/60/0/155/4': 'Alarmcode                                   ',
      '1/60/0/155/5': 'Kaminkehrerbetrieb Leistung                 ',
      '1/60/0/155/6': 'Kaminkehrerbetrieb Restlaufzeit             ',
    // 156 Infoebene
      '1/60/0/156/0': 'Solltemperatur                              ',
      '1/60/0/156/1': 'Kesseltype                                  ',
      '1/60/0/156/2': 'Betriebsstunden BioWIN-II                   ',
      '1/60/0/156/3': 'Laufzeit bis Reinigung                      ',
      '1/60/0/156/4': 'Weichen-/Puffertemperatur                   ',
      '1/60/0/156/5': 'Laufzeit bis Hauptreinigung                 ',
      '1/60/0/156/6': 'Laufzeit bis Wartung                        ',
      '1/60/0/156/7': 'Aktuelle Kesselleistung                     ',
      '1/60/0/156/8': 'Anzahl der Brennerstarts                    ',
      '1/60/0/156/9': 'Temperatur Abgas BioWIN-II                  ',
      '1/60/0/156/10': 'Pelletverbrauch gesamt                     ',
      '1/60/0/156/11': 'Pelletverbrauch seit Befüllung             ',
    // 157 Betreiberebene
      /**
       * 0: ausgeschaltet
       * 1: ohne Zeitsteuerung
       * 2: mit Freigabezeit
       * 3: mit Startzeit
       */
      '1/60/0/157/0': 'Betriebsart Zuführung                       ',
      /**
       * 0: alle Sonden
       * 1: nur Sonde 1
       * 2: nur Sonde 2
       * 3: nur Sonde 3
       * 4: nur Sonde 4
       * 5: nur Sonde 5
       * 6: nur Sonde 6
       * 7: nur Sonde 7
       * 8: nur Sonde 8
       * 16: nur Zone 1
       * 17: nur Zone 2
       */
      '1/60/0/157/1': 'Sondenumschaltung                           ',
      '1/60/0/157/2': 'Zuführung mit Freigabezeit Ende             ',
      '1/60/0/157/3': 'Zuführung mit Freigabezeit Begin            ',
      '1/60/0/157/4': 'Zuführung mit Startzeit Startzeit           ',
      '1/60/0/157/5': 'Startzeiten für Ascheverdichtung Startzeit 1',
      '1/60/0/157/6': 'Startzeiten für Ascheverdichtung Startzeit 2',
      '1/60/0/157/7': 'Heizflächenreinigung Beginn Sperrzeit       ',
      '1/60/0/157/8': 'Uhrzeit                                     ',
      '1/60/0/157/8': 'Datum                                       ',
    // 158 Serviceebene
      /**
       * Betriebswahl
       * 0: AUS
       * 1: EIN
       * 2: Handbetrieb
       * 3: Kaminkehrbetrieb
       * 4: Aktorentest
       */
      '1/60/0/158/0': 'Betriebswahl                                ',
      '1/60/0/158/1': 'Hysterese Brenner EIN                       ',
      '1/60/0/158/2': 'Maximalwert der Solltemperatur              ',
      '1/60/0/158/3': 'Solltemperatur ext. Wärmeanforderung        ',
      '1/60/0/158/4': 'Anzahl der Rostrüttelungen Ausbrand         ',
      '1/60/0/158/5': 'Anzahl der Rostrüttelungen Betrieb          ',
      '1/60/0/158/6': 'Laufzeit der Saugturbine                    ',
      '1/60/0/158/7': 'Zuluftklappe Laufzeit                       ',
      '1/60/0/158/8': 'Förderzeit Zündphase                        ',
      '1/60/0/158/9': 'Grenzen für Gebläsedrehzahl Minimalwert     ',
// 65 LogWIN
  // 0 LogWIN
    // 155 Titelbild
      /**
       * 0: Ausgeschaltet
       * 1: Abschaltvorgang
       * 2: Festbrennstoff-/ Pufferbetrieb
       * 3: Pelletszuführung in Betrieb
       * 4: Pelletszuführung
       * 5: Ein
       * 6: Pelletszuführung in Betrieb
       * 7: Pelletszuführung
       * 8: Handbetrieb
       * 9: Kaminkehrerfunktion
       * 10: Aktorentest
       * 11: Installationsvorgang aktiv
       */
      '1/65/0/155/0': 'Betriebsarten LogWIN                        ',
      /**
       * 1: Selbsttest
       * 2: WE ausschalten
       * 3: Standby
       * 6: Zündphase
       * 7: Flammenstabilisierung
       * 8: Modulationsbetrieb
       * 9: Kessel gesperrt
       * 10: Standby Sperrzeit
       * 11: Gebläse AUS
       * 12: Verkleidungstür offen
       * 13: Zündung bereit
       * 14: Abbruch Zündphase
       * 15: Anheizvorgang
       * 16: Schichtladung
       * 17: Ausbrand
       */
      '1/65/0/155/1': 'Betriebsphasen LogWIN                       ',
      '1/65/0/155/2': 'Kesseltemperatur Istwert                    ',
      '1/65/0/155/3': 'Alarmcode                                   ',
    // 156 Titelbild
      '1/65/0/156/0': 'Kesseltype                                  ',
      '1/65/0/156/1': 'Betriebsstunden LogWIN                      ',
      '1/65/0/156/2': 'Puffertemperatur Oben                       ',
      '1/65/0/156/3': 'Puffertemperatur Unten                      ',
      '1/65/0/156/4': 'Puffertemperatur Mitte                      ',
      '1/65/0/156/5': 'Anzahl Anheizvorgänge                       ',
      '1/65/0/156/6': 'Temperatur Abgas LogWIN                     ',
      '1/65/0/156/7': 'Brennkammertemperatur                       ',
      '1/65/0/156/8': 'Puffer-Beladegrad                           ',
      '1/65/0/156/9': 'Softwareversion Feuerungsautomat            ',
    // 157 Betreiberebene
      '1/65/0/157/0': 'Startverzögerung Automatikkessel            ',
      '1/65/0/157/1': 'Uhrzeit                                     ',
      '1/65/0/157/2': 'Datum                                       ',
      '1/65/0/157/3': 'Sperrzeit bis                               ',
      '1/65/0/157/4': 'Startverzögerung Abbruch                    ',
    // 158 Serviceebene
      /**
       * 0: AUS
       * 1: EIN
       * 2: Handbetrieb
       * 3: Kaminkehrerbetrieb
       * 4: Aktorentest
       * 5:
       */
      '1/65/0/158/0': 'Betriebswahl                                ',
      '1/65/0/158/1': 'Kesseltemperatur für Neustart               ',
      '1/65/0/158/2': 'Saugzuggebläse Soll-Drehzahl                ',
      '1/65/0/158/3': 'Position Primär-LK                          ',
      '1/65/0/158/4': 'Position Sekundär-LK                        ',
      '1/65/0/158/5': 'O2 Signal                                   ',
      /**
       * 0: Nein
       * 1: Ja
       */
      '1/65/0/158/6': 'Elektrische Zündung                         ',
      /**
       * 0: Automatische Erkennung
       * 1: Normal
       * 2: Gluterhaltung
       */
      '1/65/0/158/7': 'Ausbrand                                    ',
      '1/65/0/158/8': 'O2 Heizstrom                                ',
      /**
       * 0: Nein
       * 1: Ja
       */
      '1/65/0/158/9': 'Kombikessel                                 ',
    };



if (program.list) {
  listOIDs();
} else if (program.fetch) {
  fetchValues(program.fetch)
} else if (program.openhab) {
  openHABValue(program.openhab);
} else {
  program.help();
}

/////////////////////////////////////////////////////////////////////////////
// Implementation details
/////////////////////////////////////////////////////////////////////////////

function listOIDs() {
  for (const [oid, description] of Object.entries(OIDs)) {
    console.log(oid + "\t" + description);
  }
}

function fetchValues(values) {
  queryOIDs(values.split(","), function(result) {
    console.log(result[0] + "\t" + result[1]);
  });
}

function openHABValue(hab) {
	console.log(hab);
  var parsed = hab.toString().split(" ");
  queryOIDs([parsed[0]], function(result) {
    postToOpenHab(parsed[1], result[1])
  });
}

function postToOpenHab(url, value) {
  console.log(url + " - " + value);

  var request = require('request');
  request({
      url: url,
      method: "POST",
      body: value
  }, function (error, response, body){
     // console.log(error); FIXME :)
  });
}

/**
 * 
 * @param {[String]} oids 
 * @param {function([oid, value])} callback 
 */
function queryOIDs(oids, callback) {
  var sem = require('semaphore')(1);
  var digestRequest = require('request-digest')(config.USERNAME, config.PASSWORD);
  for (const [position, oid] of Object.entries(oids)) {
    sem.take(function() {
      digestRequest.requestAsync({
        host: config.HOST,
        path: PATH + oid,
        port: 80,
        method: 'GET'
      })
      .then(function (response) {
        callback([oid, mapOidValue(oid, response.body)]);
        setTimeout(sem.leave, 200);
      })
      .catch(function (error) {
        console.log(error)
        console.log(error.statusCode);
        console.log(error.body);
      });
    });
  }
}

/////////////////////////////////////////////////////////////////////////////
// Helper methods
/////////////////////////////////////////////////////////////////////////////

function mapOidValue(oid, json) {
    var parsed = JSON.parse(json);
    var unit = parsed["unit"] ? " " + parsed["unit"] : "" // either unit or empty
    var value = translateRawValue(oid, parsed["value"])
    return value + unit;
}

function translateRawValue(oid, value) {
  switch (oid) {
    case "1/60/0/155/1":
      switch (value) {
        case "0": return "Brenner gesperrt";
        case "1": return "Selbsttest";
        case "2": return "WE ausschalten";
        case "3": return "Standby";
        case "4": return "Brenner AUS";
        case "5": return "Vorspülen";
        case "6": return "Zündphase";
        case "7": return "Flammenstabilisierung";
        case "8": return "Modulationsbetrieb";
        case "17": return  "Ausbrand";
        default: return value;
      }
    case "1/60/0/155/3":
      switch (value)  {
        case "0": return "Ausgeschaltet";
        case "1": return "Abschaltvorgang";
        case "2": return "Festbrennstoff-/ Pufferbetrieb";
        case "3": return "Pelletszuführung in Betrieb";
        case "4": return "Pelletszuführung";
        case "5": return "Ein";
        case "6": return "Pelletszuführung in Betrieb";
        case "7": return "Pelletszuführung";
        case "8": return "Handbetrieb";
        case "9": return "Kaminkehrfunktion";
        case "10": return "Aktorentest";
        case "11": return "Installationsvorgang aktiv";
        default: return value;
      }
    case "1/65/0/155/0": {
      switch (value){
        case "0": return "Ausgeschaltet";
        case "1": return "Abschaltvorgang";
        case "2": return "Festbrennstoff-/ Pufferbetrieb";
        case "3": return "Pelletszuführung in Betrieb";
        case "4": return "Pelletszuführung";
        case "5": return "Ein";
        case "6": return "Pelletszuführung in Betrieb";
        case "7": return "Pelletszuführung";
        case "8": return "Handbetrieb";
        case "9": return "Kaminkehrerfunktion";
        case "10": return "Aktorentest";
        case "11": return "Installationsvorgang aktiv";
        default: return value;
      }
    }
    case "1/65/0/155/1": {
      switch (value){
        case "1": return "Selbsttest";
        case "2": return "WE ausschalten";
        case "3": return "Standby";
        case "6": return "Zündphase";
        case "7": return "Flammenstabilisierung";
        case "8": return "Modulationsbetrieb";
        case "9": return "Kessel gesperrt";
        case "10": return "Standby Sperrzeit";
        case "11": return "Gebläse AUS";
        case "12": return "Verkleidungstür offen";
        case "13": return "Zündung bereit";
        case "14": return "Abbruch Zündphase";
        case "15": return "Anheizvorgang";
        case "16": return "Schichtladung";
        case "17": return "Ausbrand";
        default: return value;
      }
    }
    default:
      return value;
  }
}
