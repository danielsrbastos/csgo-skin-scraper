const puppeteer = require('puppeteer')
const fs = require('fs')
const path = require('path')
const { v4: uuid } = require('uuid')

const weapons = [
    // { weapon: 'CZ75-Auto', id: 63 },
    // { weapon: 'Desert Eagle', id: 1 },
    // { weapon: 'Dual Berettas', id: 2 },
    // { weapon: 'Five-SeveN', id: 3 },
    // { weapon: 'Glock-18', id: 4 },
    // { weapon: 'P2000', id: 32 },
    // { weapon: 'P250', id: 36 },
    // { weapon: 'R8 Revolver', id: 64 },
    // { weapon: 'Tec-9', id: 30 },
    // { weapon: 'USP-S', id: 61 },
    // { weapon: 'AK-47', id: 7 },
    // { weapon: 'AUG', id: 8 },
    // { weapon: 'AWP', id: 9 },
    // { weapon: 'FAMAS', id: 10 },
    // { weapon: 'G3SG1', id: 11 },
    // { weapon: 'Galil AR', id: 13 },
    // { weapon: 'M4A1-S', id: 60 },
    // { weapon: 'M4A4', id: 16 },
    // { weapon: 'SCAR-20', id: 38 },
    // { weapon: 'SG 553', id: 39 },
    // { weapon: 'SSG 08', id: 40 },
    // { weapon: 'MAC-10', id: 17 },
    // { weapon: 'MP5-SD', id: 23 },
    // { weapon: 'MP7', id: 33 },
    // { weapon: 'MP9', id: 34 },
    // { weapon: 'PP-Bizon', id: 26 },
    // { weapon: 'P90', id: 19 },
    // { weapon: 'UMP-45', id: 24 },
    // { weapon: 'MAG-7', id: 27 },
    // { weapon: 'Nova', id: 35 },
    // { weapon: 'Sawed-Off', id: 29 },
    // { weapon: 'XM1014', id: 25 },
    // { weapon: 'M249', id: 14 },
    // { weapon: 'Negev', id: 28 },
    // { weapon: 'Nomad Knife', id: 518 },
    // { weapon: 'Skeleton Knife', id: 525 },
    // { weapon: 'Survival Knife', id: 521 },
    // { weapon: 'Paracord Knife', id: 517 },
    // { weapon: 'Classic Knife', id: 503 },
    // { weapon: 'Bayonet', id: 500 },
    // { weapon: 'Bowie Knife', id: 514 },
    // { weapon: 'Butterfly Knife', id: 515 },
    // { weapon: 'Falchion Knife', id: 512 },
    // { weapon: 'Flip Knife', id: 505 },
    // { weapon: 'Gut Knife', id: 506 },
    // { weapon: 'Huntsman Knife', id: 509 },
    // { weapon: 'Karambit', id: 507 },
    // { weapon: 'M9 Bayonet', id: 508 },
    // { weapon: 'Navaja Knife', id: 520 },
    // { weapon: 'Shadow Daggers', id: 516 },
    // { weapon: 'Stiletto Knife', id: 522 },
    // { weapon: 'Talon Knife', id: 523 },
    { weapon: 'Ursus Knife', id: 519 },
]

;(async () => {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()

    for (let m = 0; m < weapons.length; m++) {
        const weapon = weapons[m].weapon
        const weaponID = weapons[m].id

        console.log(`Scraping skins for ${weapon}...`)

        await page.goto(`https://csgostash.com/weapon/${weapon}`, {
            waitUntil: 'domcontentloaded',
        })

        // await page.on('console', (log) => console[log._type](log._text))

        let skins = await page.evaluate(
            ({ weapon, weaponID }) => {
                const _skins = []
                const elements = document.querySelectorAll(
                    "a[href*='https://csgostash.com/skin']"
                )

                elements.forEach((element) => {
                    if (element.childNodes[0].localName === 'img') {
                        _skins.push({
                            id: weaponID,
                            weaponName: weapon,
                            label: '',
                            value: 0,
                            skinImgURL: element.childNodes[0].src,
                            skinURL: element.href,
                            vanilla: element.childNodes[0].alt.includes(
                                'Vanilla'
                            ),
                            quality:
                                element.parentElement.childNodes[3]
                                    .childNodes[1].childNodes[1].textContent,
                        })
                    }
                })

                return _skins
            },
            { weapon, weaponID }
        )

        const skinsWithPhases = []

        for (let i = 0; i < skins.length; i++) {
            if (typeof skins[i].skinURL == undefined) continue

            try {
                await page.goto(skins[i].skinURL, {
                    waitUntil: 'domcontentloaded',
                })
            } catch (e) {
                console.log(skins[i])
            }

            let skin = await page.evaluateHandle(({ weapon, weaponID, vanilla }) => {
                let element = document.querySelector(
                    `span[data-original-title='Each skin has a "paint index" defining it in the CS:GO game files. This number is useful to identify the phase of a Doppler or Gamma Doppler knife, but is not important for most skins.']`
                )

                if (element === null) {
                    element = document.querySelector(
                        `span[title='Each skin has a "paint index" defining it in the CS:GO game files. This number is useful to identify the phase of a Doppler or Gamma Doppler knife, but is not important for most skins.']`
                    )
                }

                const div = document.getElementsByClassName(
                    'well result-box nomargin'
                )

                if (element && element.textContent.includes('Multiple')) {
                    const _skins = []
                    const knifeName = div[0].childNodes[1].textContent

                    const phases = document.querySelectorAll(
                        '.text-restricted, .text-classified, .text-covert'
                    )

                    phases.forEach((phase, i) => {
                        const phaseElement = document.querySelectorAll('em')

                        if (phaseElement[0].childNodes[0].localName === 'a') i++

                        const phaseID = +phaseElement[i].textContent.replace(
                            /\D/g,
                            ''
                        )

                        const elements = document.querySelectorAll(
                            "a[href*='https://csgostash.com/storage/img']"
                        )

                        const skin = {
                            id: weaponID,
                            weaponName: weapon,
                            label: `${knifeName} - ${phase.textContent}`.replace(
                                /(.*)(?<=\| )/g,
                                ''
                            ),
                            value: phaseID,
                            skinImgURL:
                                elements[
                                    phaseElement[0].childNodes[0].localName ===
                                    'a'
                                        ? i
                                        : i + 1
                                ].childNodes[1].src,
                            quality: 'Covert Knife',
                        }

                        _skins.push(skin)
                    })

                    return JSON.stringify(_skins)
                }

                return JSON.stringify({
                    id: !vanilla ? element.textContent : 0,
                    name: div[0].childNodes[1].textContent.replace(
                        /(.*)(?<=\| )/g,
                        ''
                    ),
                })
            }, { weapon, weaponID, vanilla: skins[i].vanilla })

            skin = JSON.parse(await skin.jsonValue())

            if (Array.isArray(skin)) {
                skin.forEach((_skin) => skinsWithPhases.push(_skin))
            } else {
                skins[i].label = skin.name
                skins[i].value = +skin.id

                delete skins[i].skinURL
                delete skins[i].vanilla
            }
        }

        skins = [...skins, ...skinsWithPhases]
        skins = skins.filter((skin) => typeof skin.vanilla === 'undefined')

        skins = skins.map(_skin => ({ uuid: uuid(), ..._skin }))

        fs.writeFileSync(
            path.resolve(__dirname, '../dump', `${weaponID}.json`),
            JSON.stringify(skins, null, 4).replace(/\\n/g, '')
        )

        console.log(`Generated ${weaponID}.json (${weapon}) in dump directory.`)
    }

    await browser.close()
})()
