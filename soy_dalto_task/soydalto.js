const materiaHTML = document.querySelector(".materias");

const materiasData = [
  { nombre: "Cálculo I", nota: "3.4" },
  { nombre: "Álgebra Lineal", nota: "3.5" },
  { nombre: "Competencias comunicativas", nota: "4.0" },
  { nombre: "Introducción a la Ing. Industial", nota: "4.5" },
  { nombre: "Ingles IV", nota: "4.0" },
];


const obtenerMateria = (id) => {
    return new Promise((res, rej) => {
      if (materiasData[id] == undefined) rej("La matería no existe");
      setTimeout(() => {res(materiasData[id])}, Math.random() * 1000);
    });
  };
  
const imprimirMaterias = async () => {
    for (let i = 0; i < materiasData.length; i++) {
        const tempMatObj = await obtenerMateria(i)
            .catch(err => console.log(err));
        const htmlCode = `
        <div class="materia">
            <div class="nombre">${tempMatObj.nombre}</div>
            <div class="nota">${tempMatObj.nota}</div>
        </div>
        `
        materiaHTML.innerHTML += htmlCode
    }
}

imprimirMaterias()




// const obtenerMateria = (id) => {
//   return new Promise((res, rej) => {
//     if (materiasData[id] == undefined) rej("La matería no existe");
//     setTimeout(() => {
//       return res(materiasData[id]);
//     }, 3000);
//   });
// };

// obtenerMateria(2)
// .then( materiaObj => console.log(materiaObj.nombre))
// .catch(err => console.log(err))