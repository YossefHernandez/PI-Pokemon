const { Router } = require('express');
const axios = require("axios");
const {Pokemon, Type} = require('../db.js');
// Importar todos los routers;
// Ejemplo: const authRouter = require('./auth.js');


const router = Router();

// Configurar los routers
// Ejemplo: router.use('/auth', authRouter);

//ruta de prueba
// router.get('/', (req, res)=>{
//     res.send('hola')
// })

//ruta para obtener todos los pokemons- https://pokeapi.co/api/v2/pokemon
const cache = [];
router.get('/pokemons', async (req,res)=>{
    try {
        //llamado asincronico de la api con axios, se ingresa a la data.results para entrar a el name y el link adicional
        //llamamos a la base de datos con los 2 modelos
    const db = await Pokemon.findAll({ include: [{model:Type}]})
    //const  api sirve para llamar la api trayendo sus propiedades, las mas importantes seria el next y el name y la url para acceder a la info del pokemon
    const api = await axios.get("https://pokeapi.co/api/v2/pokemon")
    //const apiSP sirve para acceder a la propiedad next para la segunda pagina de la api con los otros 20 pokemons y asi poder acceder a su name y url
    const apiSp = await axios.get(api.data.next)
    //se concatenan los 20 primeros y los siguientes 20
    const pokemons = api.data.results.concat(apiSp.data.results)
    //se mapea cada elemento del pokemon para sacar la url
    const pokeinfo = pokemons.map(poke => axios.get(poke.url))
    //
    const pokemonsMaps = await Promise.all(pokeinfo)
    //const pokeget sirve para mapear la info y generar el modelo esperado
    const pokeget = pokemonsMaps.map(poke =>{
        return{
            id: poke.data.id,
                name: poke.data.name,
                hp: poke.data.stats[0]["base_stat"],
                attack: poke.data.stats[1]["base_stat"],
                defense: poke.data.stats[2]["base_stat"],
                speed: poke.data.stats[5]["base_stat"],
                height: poke.data.height,
                weight: poke.data.weight,
                image: poke.data.sprites.other.home.front_default,
                types: poke.data.types.map(t => t.type.name)
        }
    })
    //aqui alistamos el resultado con las propiedades
    const resultado = {};
        resultado.pokemons = pokeget;
        resultado.creados = db
        resultado.pokemons.map(obj => cache.push(obj))
        resultado.creados.map(obj => cache.push(obj))
        //aqui enviamos a la constante vacia creada al inicio
        res.send(cache)
    } catch (e) {
        console.log(e)
    }
})

//ruta para crear pokemon

router.post('/pokemonscreate', async (req,res)=>{
    //se desestructura la informacion proveniente del body, se reciben y separan
    const {name, health, attack, defense, velocity, weight, height, image, type} = req.body
    //validamos que la informacion exista para confirmar que llega del front
    if(!name || !health || !attack || !defense || !velocity || !weight || !height || !image)
    res.json({msg: "datos insuficientes"})
    try {
        //al create le pasamos el objeto que necesita mi base de datos
        const nuevoPoke = await Pokemon.create({name, health, attack, defense, velocity, weight, height, image})
       
        nuevoPoke.addType(type)
       
        const aux = Pokemon.findByPk(nuevoPoke.id, {include: [{model: Type}]})
       
        res.send(aux)


    } catch (e) {
        
    }
})

//ruta para cargar los tipos a la bd y usarlos
const cachetype = []
router.get('/types', async (req, res)=>{
    //https://pokeapi.co/api/v2/type
    try {
        //importamos los tipos de pokemon
        const typePoke = await axios.get("https://pokeapi.co/api/v2/type")
        // se allede a los resultados en el api
        const typePoke2= typePoke.data.results
        //mapeamos los resultados para acceder al url
        const typePoke3= typePoke2.map(type => axios.get(type.url))
        //
        const urlMaps = await Promise.all(typePoke3)
        console.log(urlMaps)
        //generamos el modelo en el que mandara la informacion
        const typeGet = urlMaps.map(type => {
            return{
                id: type.data.id,
                name: type.data.name
            }
        })

        const resultado ={}
        resultado.typePoke = typeGet
        resultado.typePoke.map(obj => cachetype.push(obj))
        
        //creamos typos en la bd

        Type.bulkCreate(cachetype)
        
        res.send(cachetype)

    } catch (e) {
        console.log(e)
    }   
})

router.get('/pokemons/:id', async (req, res)=>{
    const {id} = req.params
    if(!id) res.status(400).json({msg: "ID inexistente"})
    try {
        const poke = await Pokemon.findByPk(id, {include: [{model: Type}]})
        res.send(poke)

    } catch (e) {
        console.log(e)
    }
})

//ruta para obtener el pokemon por el nombre exacto

router.get('/pokemons?name="..."',(req, res)=>{

})

module.exports = router;
