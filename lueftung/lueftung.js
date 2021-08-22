/*******************************************************
* https://github.com/Feuer-sturm/Skriptsammlung
* 22.08.21 V1.0.0    Initiale Version
*******************************************************/ 


//valloxmv.0.A_CYC_TEMP_OUTDOOR_AIR -> aktuelle Außentemperatur durch Lüftung. Nur genau wenn diese auch läuft
//daswetter.0.NextHours.Location_1.Day_1.tempmax_value-> maximal Temperatur Tag von daswetter


setObject('0_userdata.0.lueftung', {common: {name: 'Lueftung'},type: 'channel'});

createState('0_userdata.0.lueftung.AutomatikmodusNachtsAbwesend', false, {name: 'Status ob Nachts in den Automatikmodus geschaltet werden soll', unit: '', type: 'boolean', role: 'value', def: false});
createState('0_userdata.0.lueftung.AutomatikmodusHitzeAbschaltung', false, {name: 'Status ob bei Hitze die Lueftung automatisch ausgeschaltet werden soll', unit: '', type: 'boolean', role: 'value', def: false});
createState('0_userdata.0.lueftung.AnzTageReinigung', 0, {name: 'Anzahl an Tagen wann die Lueftungsanlage gereinigt werden muss', unit: '', type: 'number', role: 'value', def: 0});
createState('0_userdata.0.lueftung.AnzTageReinigungReset', false, {name: 'Trigger zum zuruecksetzen der Anzahl an Tagen wann die Lueftungsanlage gereinigt werden muss', unit: '', type: 'boolean', role: 'button', def: false});

const SkriptVersion = "1.0.0"; 

const cMaterialdesignAlert = true;
const debug = true;


const DP_AutomatikmodusNachtsAbwesend   = '0_userdata.0.lueftung.AutomatikmodusNachtsAbwesend';
const DP_AutomatikmodusHitzeAbschaltung = '0_userdata.0.lueftung.AutomatikmodusHitzeAbschaltung';
const DP_AnzTageReinigung               = '0_userdata.0.lueftung.AnzTageReinigung';
const DP_AnzTageReinigungReset          = '0_userdata.0.lueftung.AnzTageReinigungReset';


const cTemperaturschwelleUeberwachungAktiv  = 20;    //Ab dieser Aussentemperatur wird zyklisch geprüft ob die Lüftung wegen hoher Außentemperatur abgeschaltet werden soll
const TemperaturSchwelleAbschaltung         = 25;   //Temperaturschwelle der Aussentemperatur ab wann Lueftungsanlage abgeschaltet werden soll
const cAnzahlTageReinigung                  = 14;   // Wert gibt die Tage an, nach der die Lueftung gereinigt werden muss
const cTextAlertMessageLueftungReinigen     = 'Lüftungsanlage reinigen';


console.log("Starting lueftung.js V" + SkriptVersion);



//========================================================================================================
//========================================================================================================
// Wenn die Funktion aufgerufen wird, wird zur eingestellten Uhrzeit die Lüftung in den Status "Abwesend"
// geschaltet um die Geräusche Nachts zu minimieren
//========================================================================================================
//========================================================================================================
function AutomatikmodusLueftungNachtsAbwesend(){

    if( getState(DP_AutomatikmodusNachtsAbwesend).val == true && 
        getState("valloxmv.0.ACTIVE_PROFILE").val != 2) {

            setState("valloxmv.0.ACTIVE_PROFILE",2); //Lüftung wird in den Modus Abwesend geschaltet

            if(debug) console.log("Lueftung: AutomatikmodusLueftungNachtsAbwesend ausgeführt ");

            if(cMaterialdesignAlert){
                materialDesignWidgets.sendTo(
                    'javascript.0.AlertMessages_Materialdesign.AlertMessages_Vis-Main', 
                    'Lüftungsmodus auf Abwesend geschaltet (Nachtmodus)',
                    'white', 
                    'blue',
                    'information-outline',
                    'blue',
                    'blue'
                    );
            }
    }
}





//========================================================================================================
//========================================================================================================
// xxx
//========================================================================================================
//========================================================================================================


function HeisserSommertagLueftungAbschaltung(){

    if(getState("valloxmv.0.A_CYC_TEMP_OUTDOOR_AIR").val >= (TemperaturSchwelleAbschaltung - 2)) {

        if(cMaterialdesignAlert){
            if(FindEntryInJsonAlertMessage('Lüftung bald ausschalten. Außentemperatur bald höher als Innentemperatur') == false){
                //Warnung auf der VIS Startseite ausgeben
                materialDesignWidgets.sendTo(
                    'javascript.0.AlertMessages_Materialdesign.AlertMessages_Vis-Main', 
                    'Lüftung bald ausschalten. Außentemperatur bald höher als Innentemperatur',
                    'white', 
                    'orange',
                    'alert-outline',
                    'orange',
                    'black'
                );
            }
        }
    }   

    if(getState("valloxmv.0.A_CYC_TEMP_OUTDOOR_AIR").val >= (TemperaturSchwelleAbschaltung)) {

        LueftungsanlageBetriebszustandAendern(false); //Lüftung ausschalten
        
        if(debug) console.log("Lueftung: HeisserSommertagLueftungAbschaltung - Lüftung ausgeschaltet ");

        if(cMaterialdesignAlert){
            if(FindEntryInJsonAlertMessage('Lüftung ausgeschalten. Außentemperatur höher als Innentemperatur') == false){
                //Warnung auf der VIS Startseite ausgeben
                materialDesignWidgets.sendTo(
                    'javascript.0.AlertMessages_Materialdesign.AlertMessages_Vis-Main', 
                    'Lüftung ausgeschalten. Außentemperatur höher als Innentemperatur',
                    'white', 
                    'orange',
                    'alert-outline',
                    'orange',
                    'black'
                );
            }
        }
    }   
}

//========================================================================================================
//========================================================================================================
// Funktion dient dazu, um die Lueftung einzuschalten (true) oder auszuschalten (false)
//========================================================================================================
//========================================================================================================
function LueftungsanlageBetriebszustandAendern(modus){

    if(modus === true){
        setState("valloxmv.0.A_CYC_MODE",0);
        if(debug) console.log("Lüftung.js - Lüftung eingeschaltet");
    }
    else if (modus === false){
        setState("valloxmv.0.A_CYC_MODE",5);
        if(debug) console.log("Lüftung.js - Lüftung ausgeschaltet");
    }

}


//========================================================================================================
//========================================================================================================
// Funktion zur Steuerung wann die Lueftung haendisch gereinigt werden muss
//========================================================================================================
//========================================================================================================

function ReinigungLueftung(){

    let AnzTageReinigungAktuell
    AnzTageReinigungAktuell = getState(DP_AnzTageReinigung).val;
    
    if(AnzTageReinigungAktuell > 0){
        setState(DP_AnzTageReinigung, AnzTageReinigungAktuell - 1);
    }

    if(AnzTageReinigungAktuell == 0){
        if(cMaterialdesignAlert){
            if(FindEntryInJsonAlertMessage(cTextAlertMessageLueftungReinigen) === false){
                materialDesignWidgets.sendTo(
                    'javascript.0.AlertMessages_Materialdesign.AlertMessages_Vis-Main', 
                    cTextAlertMessageLueftungReinigen,
                    'white', 
                    'red',
                    'alert-outline',
                    'red',
                    'red'
                    );
            }
        }
    }
}








//========================================================================================================
//========================================================================================================
//Bei Aenderung der Aussentemperatur wird die Funktion aufgerufen. Die Aussentemperatur ist nur solange aussagekraeftig wie
//die Lueftung auch laeuft
//========================================================================================================
//========================================================================================================
on({id: "valloxmv.0.A_CYC_TEMP_OUTDOOR_AIR", valGt: cTemperaturschwelleUeberwachungAktiv, change: "ne"}, function(obj){

    if(debug) console.log("Trigger Außentemperatur: Betriebszustand Lüftungsanlage:" + getState("valloxmv.0.A_CYC_MODE").val + 
        " Außentemperatur: " +  getState("valloxmv.0.A_CYC_TEMP_OUTDOOR_AIR").val);
    
    //Automatikmodus zur Hitzeabschaltung ist ueber VIS aktviert und die Lueftung ist im Betriebszustand An (Normalbetrieb)
    if(getState(DP_AutomatikmodusHitzeAbschaltung).val == true && getState("valloxmv.0.A_CYC_MODE").val == 0){
        HeisserSommertagLueftungAbschaltung();
    }
});  



//Wird Reset Button betaetigt wird der Tageszaehler fuer die Reinigung wieder auf den definierten Wert zurueckgesetzt
on({id: DP_AnzTageReinigungReset, change: "any"}, function(obj){

    setState(DP_AnzTageReinigung,cAnzahlTageReinigung);
    DeleteEntryJsonAlertMessage(cTextAlertMessageLueftungReinigen);
}); 


//Die nachfolgenden Funktionen werden immer um 22 Uhr aufgerufen
schedule("0 22 * * *", function () { 
    AutomatikmodusLueftungNachtsAbwesend();
});


//Die nachfolgenden Funktionen werden immer um 20 Uhr aufgerufen
schedule("0 20 * * *", function () { 

    //Wenn Lüftung ausgeschaltet ist, schalte sie wieder ein
    if(getState("valloxmv.0.A_CYC_MODE").val == 5){
        LueftungsanlageBetriebszustandAendern(true);  //Lüftung einschalten
        if(debug) console.log("Lueftung: schedule - LueftungsanlageBetriebszustandAendern auf true ");

        //Temporäre Lösung solange keine sichere Außentemperatur eingelesen werden kann
        //Lüfunt wird zeitgesteuert abends wieder eingechaltet, damit die Lüftung nicht andauernd ein und wieder aus geht, wird
        //der "AutomatikmodusHitzeAbschaltung" deaktivert.
        //Zeitesteuert, muss dann zu einem späteren Zeitpunkt z.B. am nächsten Morgen die Option wieder aktiviert werden
        setState(DP_AutomatikmodusHitzeAbschaltung, false);
        if(debug) console.log("schedule 20 Uhr: DP_AutomatikmodusHitzeAbschaltung FALSE")

    } 
});








//Taegliche Ausfuehrung morgens um 6 Uhr
schedule("0 6 * * *", function () { 
    ReinigungLueftung();


    //Temporäre Lösung solange keine sichere Außentemperatur eingelesen werden kann
    //Lüfunt wird zeitgesteuert abends wieder eingechaltet, damit die Lüftung nicht andauernd ein und wieder aus geht, wird
    //der "AutomatikmodusHitzeAbschaltung" deaktivert.
    //Zeitesteuert, muss dann zu einem späteren Zeitpunkt z.B. am nächsten Morgen die Option wieder aktiviert werden
    setState(DP_AutomatikmodusHitzeAbschaltung, true);
    if(debug) console.log("schedule 6 Uhr: DP_AutomatikmodusHitzeAbschaltung TRUE")

});

