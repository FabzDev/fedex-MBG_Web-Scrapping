class Persona {
  constructor(nombre, instagram) {
    this.nombre = nombre;
    this.instagram = instagram;
  }
}

const data = [
  ["Lucas", "@soylucas"],
  ["Robertico", "@soyrober"],
  ["Rancio", "@soyrancio"],
  ["Cami"],
];

const personas = [];

for (let i = 0; i < data.length; i++) {
  personas[i] = new Persona(data[i][0], data[i][1]);
}

const obtenerPersona = (id) => {
  return new Promise((res, rej) => {
    if (personas[id] == undefined) {
      rej("La persona no fue encontrada");
    } else {
      res(personas[id]);
    }
  });
};

const obtenerInstagram = (persona) => {
    return new Promise( (res, rej) => {
        if(persona.instagram == undefined){
            rej("La persona no tiene Instagram");
          } else {
            res(persona.instagram);
          }
    })
}

obtenerPersona(3)
.then(persona => {
    console.log(persona.nombre);
    return obtenerInstagram(persona)})
.catch(err => console.log(err))
