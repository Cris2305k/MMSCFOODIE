 #include <OneWire.h>

#include <DallasTemperature.h>



// Pin de datos conectado al sensor

#define ONE_WIRE_BUS 13



// Configuración del bus 1-Wire

OneWire oneWire(ONE_WIRE_BUS);



// Pasamos la referencia a DallasTemperature

DallasTemperature sensors(&oneWire);
void setup() {

  Serial.begin(9600);

  sensors.begin();
  pinMode(7,OUTPUT);
}



void loop() {

  sensors.requestTemperatures(); // Envía el comando para tomar lectura

  float tempC = sensors.getTempCByIndex(0); // Lee temperatura en °C

  Serial.print("Temperatura: ");
  Serial.print(tempC);
  Serial.println(" °C");
  if (tempC < 30 ){
      digitalWrite(7,HIGH);///
  }
  else {
     digitalWrite(7,LOW);
  }
  delay(50);
  

}
