const restify = require('restify');
const errs = require('restify-errors');

const server = restify.createServer({
    name: 'myapp',
    version: '1.0.1'
});

//isso resolve o problema de Access-Control-Allow-Origin no navegador cliente.
server.use(
    function crossOrigin(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        return next();
    }
);

//configurações do servidor para o knex
var knex = require('knex')({
    client: 'mysql',
    connection: {
        host: 'semparada-db.c1kvlkss3gfo.us-east-2.rds.amazonaws.com',
        user: 'root',
        password: 'SemPararda48H',
        database: 'semparadadb'
    }
});

server.use(restify.plugins.acceptParser(server.acceptable));
server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());

server.get('/echo/:name', function (req, res, next) {
    res.send(req.params);
    return next();
});

server.listen(8080, function () {
    console.log('%s listening at %s', server.name, server.url);
});

//insere dados de equipamentos
server.post('/post_dados_equipamentos', (req, res, next) => {
    knex('dados_equipamentos')
        .insert(req.body)
        .then((dados) => {
            res.send(dados);
        }, next)
    return next();
});

//consulta dados de equipamento apartir de um ID
server.get('/get_dado_equipamento/:id', (req, res, next) => {
    const { id } = req.params;
    knex('dados_equipamentos')
        .where('id', id)
        .first()
        .then((dados) => {
            if (!dados) return res.send(new errs.BadDigestError('Dados não encontrados'))
            res.send(dados);
        }, next)
    return next();
});

//Busca todos os dados de equipamentos gravados na tabela de dados de equipamentos
server.get('/show_dados_equipamentos', (req, res, next) => {
    knex('dados_equipamentos').then((dados) => {
        res.send(dados);
    }, next)
});

//Busca todos os equipamentos que possuem dados gravados, retornando o identificador "EQUIPAMENTO"
server.get('/get_equipamentos', (req, res, next) => {
    knex('dados_equipamentos')
        .distinct('equipamento')
        .select()
        .then((dados) => {
            res.send(dados);
        }, next)
});

//Busca dados de um equipamento específico passando por parâmetro o identificador "EQUIPAMENTO"
server.get('/get_dados_do_equipamento/:equip', (req, res, next) => {

    const { equip } = req.params;
    knex('dados_equipamentos')
        .where('equipamento', equip)
        .then((dados) => {
            if (!dados) return res.send(new errs.BadDigestError('Dados não encontrados'))
            res.send(dados);
        }, next)
    return next();
});
