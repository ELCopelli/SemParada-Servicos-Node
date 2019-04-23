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
        host: 'semparadadb.c1kvlkss3gfo.us-east-2.rds.amazonaws.com',
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
    //Tratamento para não armazenar dados de GPS sem sinal 
    if (req.body.resultado === "0.000000#0.000000" && req.body.dado === "GPS") {
        return res.send(new errs.BadDigestError('Dados de GPS sem sinal. Dados não serão armazenados.'))
    }

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
        .select(knex.raw('*, (DATE_FORMAT(data_hora, "%d/%m/%Y %H:%i:%s"))  data_hora_formatada'))
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
    knex('dados_equipamentos')
        .select(knex.raw('*, (DATE_FORMAT(data_hora, "%d/%m/%Y %H:%i:%s"))  data_hora_formatada'))
        .then((dados) => {
            res.send(dados);
        }, next)
});

//Busca todos os equipamentos que possuem dados gravados, retornando o identificador "EQUIPAMENTO"
server.get('/get_equipamentos', (req, res, next) => {
    knex('dados_equipamentos')
        .distinct('equipamento')
        .then((dados) => {
            res.send(dados);
        }, next)
});

//Busca todos os tipos de dados lidos para o equipamento, retornando o identificador "DADO"
server.get('/get_tipos_dados_equipamento/:equip', (req, res, next) => {

    const { equip } = req.params;
    knex('dados_equipamentos')
        .where('equipamento', equip)
        .distinct('dado')
        .select()
        .then((dados) => {
            if (!dados) return res.send(new errs.BadDigestError('Dados não encontrados'))
            res.send(dados);
        }, next)
    return next();
});

//Busca dados de um equipamento específico passando por parâmetro o identificador "EQUIPAMENTO" Teste
server.get('/get_dados_do_equipamento/:equip', (req, res, next) => {

    const { equip } = req.params;
    knex('dados_equipamentos')
        .select(knex.raw('*, (DATE_FORMAT(data_hora, "%d/%m/%Y %H:%i:%s"))  data_hora_formatada'))
        .where('equipamento', equip)
        .then((dados) => {
            if (!dados) return res.send(new errs.BadDigestError('Dados não encontrados'))
            res.send(dados);
        }, next)
    return next();
});

//Busca último valor lido para o tipo de dado "DADO" para o equipamento "EQUIPAMENTO" Teste
server.get('/get_ultimo_valor_dado/:equip/:dado', (req, res, next) => {

    const { equip, dado } = req.params;
    knex('dados_equipamentos')
        .select(knex.raw('*, (DATE_FORMAT(data_hora, "%d/%m/%Y %H:%i:%s"))  data_hora_formatada'))
        .where('equipamento', equip)
        .where('dado', dado)
        .where('id', knex('dados_equipamentos')
            .max('id as id')
            .where('equipamento', equip)
            .where('dado', dado))
        .then((dados) => {
            if (!dados) return res.send(new errs.BadDigestError('Dados não encontrados'))
            res.send(dados);
        }, next)
    return next();
});

//Busca últimos X valores lidos para o tipo de dado "DADO" para o equipamento "EQUIPAMENTO" Teste
server.get('/get_n_dados_equipamento/:equip/:dado/:qtde', (req, res, next) => {

    const { equip, dado, qtde } = req.params;
    knex('dados_equipamentos')
        .select(knex.raw('*, (DATE_FORMAT(data_hora, "%d/%m/%Y %H:%i:%s"))  data_hora_formatada'))
        .where('equipamento', equip)
        .where('dado', dado)
        .limit(qtde)
        .orderBy('id', 'desc')
        .then((dados) => {
            if (!dados) return res.send(new errs.BadDigestError('Dados não encontrados'))
            res.send(dados);
        }, next)
    return next();
});

//Busca últimos 100 leituras para o equipamento e dado/variável no período de tempo informado nos parâmetro
server.get('/get_dados_equip_by_date/:equip/:dado/:dataInicial/:dataFinal', (req, res, next) => {

    const { equip, dado, dataInicial, dataFinal } = req.params;
    knex('dados_equipamentos')
        .select(knex.raw('*, (DATE_FORMAT(data_hora, "%d/%m/%Y %H:%i:%s"))  data_hora_formatada'))
        .where('equipamento', equip)
        .where('dado', dado)
        .whereBetween('data_hora', [dataInicial, dataFinal])
        .limit(100)
        .orderBy('id', 'desc')
        .then((dados) => {
            if (!dados) return res.send(new errs.BadDigestError('Dados não encontrados'))
            res.send(dados);
        }, next)
    return next();
});  

//Busca maior, menor e media periodo
server.get('/get_dados_equip_by_date_estatisticas/:equip/:dado/:dataInicial/:dataFinal', (req, res, next) => {

    const { equip, dado, dataInicial, dataFinal } = req.params;
    knex('dados_equipamentos')
        .select(knex.raw('MAX(resultado) maximo, MIN(resultado) minimo, AVG(resultado) media'))
        .where('equipamento', equip)
        .where('dado', dado)
        .whereBetween('data_hora', [dataInicial, dataFinal])                
        .then((dados) => {
            if (!dados) return res.send(new errs.BadDigestError('Dados não encontrados'))
            res.send(dados);
        }, next)
    return next();
});  