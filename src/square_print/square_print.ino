#include "Arduino_JSON.h"
#include <Trill.h>
// #include <SimpleWebSerial.h>

// Create an instance of the library
// SimpleWebSerial WebSerial;

Trill trillSquare;
boolean touchActive = false;
boolean sendRaw = false;
const boolean verbose = true; // set this to false to communicate to the Processing GUI via UART.

int rawIn[30];
int h_touch[4];
int v_touch[4];
int data;
String command;
String receivedStr;
String sendStr = "";
JSONVar event;


void setup() {
  // Initialize serial communication
  Serial.begin(115200);
  
  // Define events to listen to and their callback
  // WebSerial.on("event-to-arduino", eventCallback); 
  
  // Send named events to browser with a number, string, array or json object
  // WebSerial.send("event-from-arduino", 123);

  if(trillSquare.setup(Trill::TRILL_SQUARE) != 0){
    Serial.println("failed to initialise trill square");
  }
  trillSquare.setMode(Trill::DIFF);

  event[0] = "event-from-arduino";
}



void loop() {
  // Check for new serial data every loop
  // WebSerial.send("event-from-arduino", 144);
  // Serial.println("[\"event-from-arduino\",144]");
  // WebSerial.check();
  delay(25);
  

  trillSquare.requestRawData();
  if(trillSquare.rawDataAvailable() > 0) {
    printRawData(trillSquare);
  }

}




void printRawData(Trill & trill) {

  for (int i = 0; i<4; i++){
    h_touch[i] = 0;
    v_touch[i] = 0;
  }


  int i = 0;
  int h_touch_num = 0;
  int v_touch_num = 0;
  


  while(trill.rawDataAvailable() > 0){
    data = trill.rawDataRead();
    rawIn[i] = data;
    i++;
  }
  for (int i = 0; i < 30; i++){
    if (i<4 && rawIn[i+4]>=120){
      h_touch[h_touch_num] = rawIn[i];
      h_touch_num++;
    }
    if (i>=8 && i<12 && rawIn[i+4]>=120){
      v_touch[v_touch_num] = rawIn[i];
      v_touch_num++;
    }
  }

  if (sendRaw){
    for (int i = 0; i < 4; i++){
      if(v_touch[i] < 1000)
        Serial.print(0);
      if(v_touch[i] < 100)
        Serial.print(0);
      if(v_touch[i] < 10)
        Serial.print(0);
      Serial.print(v_touch[i]);
      Serial.print(" ");
    }
    Serial.print(" - ");
    for (int i = 0; i < 4; i++){
      if(h_touch[i] < 1000)
        Serial.print(0);
      if(h_touch[i] < 100)
        Serial.print(0);
      if(h_touch[i] < 10)
        Serial.print(0);
      Serial.print(h_touch[i]);
      Serial.print(" ");
    }
    Serial.print(" -  ");
  }
  receivedStr = "";
  sendStr = "";
  if(Serial.available() > 0){
    receivedStr = Serial.readStringUntil('\n');
    receivedStr.trim();
    // command = Serial.readStringUntil('\n');
    // command = Serial.read();
    // command.trim();
    // Serial.print(command);
    // Serial.println(0);

    // Serial.print("[\"event-from-arduino\",");
    // Serial.print(receivedStr);
    // Serial.println("]");



    if (receivedStr.equals("[\"event\",1]")){
      // Serial.print("[\"event-from-arduino\",");
      // Serial.print("hi");
      // Serial.println("]");
      
      
      

      if (v_touch_num==h_touch_num){
        for (int i = 0; i < v_touch_num; i++){
          sendStr = String(sendStr + v_touch[i] + "," + h_touch[i] + "_");
          // Serial.print(v_touch[i]);
          // Serial.print("+");
          // Serial.print(h_touch[i]);
          // Serial.print("_");
        }
      }
      if (v_touch_num>h_touch_num){
        for (int i = 0; i < v_touch_num; i++){
          // Serial.print(v_touch[i]);
          // Serial.print("+");
          if (i>=h_touch_num){
            sendStr = String(sendStr + v_touch[i] + "," + h_touch[h_touch_num-1] + "_");
            // Serial.print(h_touch[h_touch_num-1]);
          } else {
            sendStr = String(sendStr + v_touch[i] + "," + h_touch[i] + "_");
            // Serial.print(h_touch[i]);
          }
          // Serial.print("_");
        }
      }

      if (v_touch_num<h_touch_num){
        for (int i = 0; i < h_touch_num; i++){
          // Serial.print("(");
          if (i>=v_touch_num){
            // Serial.print(v_touch[v_touch_num-1]);
            sendStr = String(sendStr + v_touch[v_touch_num-1] + "," + h_touch[i] + "_");
          } else {
            // Serial.print(v_touch[i]);
            sendStr = String(sendStr + v_touch[i] + "," + h_touch[i] + "_");
          }
          // Serial.print("+");
          
          // Serial.print(h_touch[i]);
          
          // Serial.print("_");
        }
      }
      
      // if (sendStr.length() > 0){
      event[1] = sendStr;
      Serial.println(JSON.stringify(event));
      // }
      
      // Serial.println("]");

    }
  }
}