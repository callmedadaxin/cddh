const express = require('express')
const router = express.Router()
const request = require('request')
const install = require('superagent-charset')
const superagent = install(require('superagent'))
const asyncLib = require('async')
const cheerio = require('cheerio')

const baseUrl = 'http://htpmsg.jiecaojingxuan.com/msg/current'
const sogouUrl = 'https://www.sogou.com/web?query='
const qh360Url = 'https://www.so.com/s?ie=utf-8&fr=none&src=360sou_newhome&q='
const questions = []

const json = {
    'code': 0,
    'msg': '成功',
    'data': {
        'event': {
            'answerTime': 10,
            'desc': '10.世界上第一部全电脑制作的动画长片是？',
            'displayOrder': 9,
            'liveId': 82,
            'options': '["玩具总动员","赛车总动员","飞机总动员"]',
            'questionId': 943,
            'showTime': 1515410193285,
            'status': 0,
            'type': 'showQuestion'
        },
        'type': 'showQuestion'
    }
}

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {
        title: 'Express'
    })
})

router.get('/query', async function (req, res, next) {
    const questionReq = await getQuestion()
    // 没有结果
    if (!questionReq) {
        return res.json({
            code: 1
        })
    }
    const event = questionReq.data.event || {}
    const {
        desc,
        options
    } = event
    // 结果已经显示
    if (questions.indexOf(desc) >= 0) {
        return res.json({
            code: 1
        })
    }
    questions.push(desc)
    return res.json({
        code: 0,
        desc: desc.slice(desc.indexOf('.') + 1),
        options
    })
});

router.post('/stat', async function (req, res, next) {
    let question = req.body.question.trim();
    let options = JSON.parse(req.body.options).map(item => {
        return item.trim()
    })
    let result = await fetchAll(question, options)

    if (!result) {
        return res.json({
            code: 1
        })
    }
    return res.send({
        code: 0,
        data: result
    })
});

let fetchAll = function (question, options) {
    return new Promise((resolve, reject) => {
        asyncLib.parallel({
            sogou: (callback) => {
                asyncLib.map(options, (option, cb) => {
                    search(sogouUrl, question, option, cb)
                }, (err, result) => {
                    if (err) callback(null, 0)
                    else callback(null, result)
                })
            },
            qh360: (callback) => {
                asyncLib.map(options, (option, cb) => {
                    search(qh360Url, question, option, cb)
                }, (err, result) => {
                    if (err) callback(null, 0)
                    callback(null, result)
                })
            }
        }, (err, results) => {
            if (err) {
                resolve(false)
            } else {
                resolve(results)
            }
        })
    })
}

let search = function (searchUrl, question, option, callback) {
    let text = '已为您找到约0条相关结果'
    superagent.get(searchUrl + encodeURIComponent(question) + encodeURIComponent(option))
        .charset().end((err, res) => {
            if (err || typeof res.text == 'undefined') {
                callback(null, {
                    option: '',
                    num: 0
                })
            } else {
                let $ = cheerio.load(res.text, {
                    decodeEntities: false
                })
                if (searchUrl === sogouUrl) {
                    text = $('p.num-tips') ? $('p.num-tips').text() : text
                } else if (searchUrl === qh360Url) {
                    text = $('span.nums') ? $('span.nums').text() : text
                }
                let num = text.match(/[\d|,]+/g)[0].replace(',', '')
                callback(null, {
                    option: option,
                    num: parseInt(num)
                })
            }
        })
}

function getQuestion() {
    return new Promise((resolve, reject) => {
        request(baseUrl, (err, res, body) => {
            let ret
            if (err) {
                resolve(false)
            }
            console.log(body)
            try {
                ret = JSON.parse(body)
            } catch(e) {
                resolve(false)
            }
            if (ret.msg === 'no data') {
                resolve(json)
            } else {
                resolve(ret)
            }
        })
    })
}

module.exports = router;