const images = {
  bg: {
    src: './images/bgs/amazfit/gtr4_black.png',
    visibility: true,
    loaded: false
  },
  watchface: {
    src: './images/defaults/round.png',
    visibility: true,
    loaded: false,
    width: 314,
    height: 314,
    radius: 157
  },
  shadow: {
    src: './images/shadows/round.png',
    visibility: false,
    loaded: false
  },
  glare: {
    src: './images/glares/amazfit/gtr4.png',
    visibility: false,
    loaded: false
  }
}

const DEFAULT_BG_COLOR = '#007eff'

class I18n {
  constructor(options = {}) {
    this.defaultLang = options.defaultLang || 'en'
    this.fallbackLang = options.fallbackLang || 'en'
    this.lang = this.defaultLang
    this.translations = {}
    this.selector = options.selector || '[data-i18n], [data-i18n-title]'
    this.attribute = options.attribute || ['data-i18n', 'data-i18n-title']
    this.pluralRules = {
      en: (n) => n === 1 ? 'one' : 'many',
      ru: (n) => n % 10 === 1 && n % 100 !== 11 ? 'one'
        : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? 'few'
          : 'many'
    }
  }

  async init(lang) {
    this.lang = lang || this.detectLanguage()
    await this.loadLanguage(this.lang)
    this.applyAll()
    document.documentElement.lang = this.lang
  }

  detectLanguage() {
    const urlLang = new URLSearchParams(window.location.search).get('lang')
    const savedLang = localStorage.getItem('lang')
    const browserLang = navigator.language.split('-')[0]
    return urlLang || savedLang || browserLang || this.defaultLang
  }

  async fetchTranslations(lang) {
    try {
      const response = await fetch(`./locales/${lang}.json`)
      if (!response.ok) throw new Error('Failed to load translations')
      return await response.json()
    } catch (error) {
      // console.error(`Error loading ${lang} translations:`, error)
      if (lang !== this.fallbackLang) {
        return this.fetchTranslations(this.fallbackLang)
      }
      return {}
    }
  }

  async loadLanguage(lang) {
    if (!this.translations[lang]) this.translations[lang] = await this.fetchTranslations(lang)
    this.lang = lang
    localStorage.setItem('lang', lang)
  }

  t(key, params = {}) {
    let value = this.getNestedValue(this.translations[this.lang], key) ||
      this.getNestedValue(this.translations[this.fallbackLang], key) ||
      key

    // Обработка плюрализации
    if (typeof value === 'object' && params.count !== undefined) {
      const rule = this.pluralRules[this.lang] || this.pluralRules.en
      const pluralForm = rule(params.count)
      value = value[pluralForm] || value.other || value.many || value.one || key
    }

    // Подстановка параметров
    if (typeof value === 'string' && params) {
      Object.keys(params).forEach(param => {
        value = value.replace(new RegExp(`\\{${param}\\}`, 'g'), params[param])
      })
    }

    return value || key
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj)
  }

  applyAll() {
    document.querySelectorAll(this.selector).forEach(element => {
      const isAttributes = Array.isArray(this.attribute)
      const key = isAttributes ? (element.getAttribute(this.attribute[0]) ?? element.getAttribute(this.attribute[1])) : element.getAttribute(this.attribute)
      const params = this.extractParams(element)
      const text = this.t(key, params)

      if (element.hasAttribute('data-i18n-title')) element.setAttribute('title', this.t(element.getAttribute('data-i18n-title'), params))
      else element.tagName === 'INPUT' && element.placeholder ? element.placeholder = text : element.textContent = text
    })
  }

  extractParams(element) {
    const params = {}
    Array.from(element.attributes).forEach(attr => {
      if (attr.name.startsWith('data-i18n-')) {
        const paramName = attr.name.replace('data-i18n-', '')
        params[paramName] = isNaN(attr.value) ? attr.value : Number(attr.value)
      }
    })
    return params
  }

  async changeLanguage(lang) {
    await this.loadLanguage(lang)
    this.applyAll()
    document.documentElement.lang = lang
    document.dispatchEvent(new CustomEvent('languageChanged', { detail: lang }))
  }
}

class Modal {
  constructor() {
    this.modal = document.createElement('div')
    this.modal.classList.add('modal')
    this.title = document.createElement('div')
    this.close = document.createElement('div')
    this.close.classList.add('button', 'closeModal')
    this.close.innerHTML = `
      <svg version="1.1" viewBox="0 0 24 24" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink">
        <path fill="currentColor"
          d="M14.8,12l3.6-3.6c0.8-0.8,0.8-2,0-2.8c-0.8-0.8-2-0.8-2.8,0L12,9.2L8.4,5.6c-0.8-0.8-2-0.8-2.8,0 c-0.8,0.8-0.8,2,0,2.8L9.2,12l-3.6,3.6c-0.8,0.8-0.8,2,0,2.8C6,18.8,6.5,19,7,19s1-0.2,1.4-0.6l3.6-3.6l3.6,3.6 C16,18.8,16.5,19,17,19s1-0.2,1.4-0.6c0.8-0.8,0.8-2,0-2.8L14.8,12z" />
      </svg>
    `
    this.close.addEventListener('click', () => this.hide())
    this.titleContainer = document.createElement('div')
    this.titleContainer.classList.add('title')
    this.titleContainer.appendChild(this.title)
    this.titleContainer.appendChild(this.close)
    this.modal.appendChild(this.titleContainer)
    this.content = document.createElement('div')
    this.modal.appendChild(this.content)
  }

  init() {
    this.modalContainer = document.getElementById('modalContainer')
    this.modalContainer.appendChild(this.modal)
  }

  insertData(type) {
    this.title.innerText = i18n.t(`titles.${type}`)
    const url = `./modals/${type}_${i18n.lang}.html`
    this.loadAndProcessHTML(url, this.content)
    this.view()
  }

  view() {
    this.modalContainer.classList.remove('hidden')
    this.modalContainer.classList.add('active')
  }
  hide() {
    this.modalContainer.classList.remove('active')
    setTimeout(() => {
      this.modalContainer.classList.add('hidden')
    }, 500);
  }

  async loadAndProcessHTML(url, targetElement) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      let html = await response.text()

      targetElement.innerHTML = html

      return targetElement
    } catch (error) {
      targetElement.innerHTML = `<p>Error loading content: ${error.message}</p>`
      return null
    }
  }
}

function formatVariantName(str) {
  const parts = str.split('_')

  const formattedParts = parts.map(part => {
    if (!part) return ''
    return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
  })

  return formattedParts.join(' ').replace(/\s+/g, ' ').trim()
}

document.addEventListener('DOMContentLoaded', () => {
  let file = false

  let devices = {}
  let lastType = 'round'

  const canvas = document.getElementById('canvas')
  const ctx = canvas.getContext('2d')

  const modal = new Modal()
  modal.init()

  loadImages()

  function loadImages() {
    for (const [key, imgData] of Object.entries(images)) {
      imgData.loaded = false
      if (imgData?.src) {
        const img = new Image()
        if (imgData?.width) img.width = `${imgData.width}`
        if (imgData?.height) img.height = `${imgData.height}`
        img.src = imgData.src
        imgData.img = img

        img.onload = () => {
          imgData.loaded = true
          updateCanvas()
        }
      }
    }
  }

  function drawHyperbolicRect(ctx, x, y, width, height, radius) {
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)

    ctx.bezierCurveTo(
      x + width - radius * 0.3, y,
      x + width, y + radius * 0.3,
      x + width, y + radius
    )

    ctx.lineTo(x + width, y + height - radius)
    ctx.bezierCurveTo(
      x + width, y + height - radius * 0.3,
      x + width - radius * 0.3, y + height,
      x + width - radius, y + height
    )

    ctx.lineTo(x + radius, y + height)
    ctx.bezierCurveTo(
      x + radius * 0.3, y + height,
      x, y + height - radius * 0.3,
      x, y + height - radius
    )

    ctx.lineTo(x, y + radius)
    ctx.bezierCurveTo(
      x, y + radius * 0.3,
      x + radius * 0.3, y,
      x + radius, y
    )
  }

  function updateCanvas() {
    canvas.width = 480
    canvas.height = 720

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()

    const allImagesLoaded = () => {
      for (const [key, image] of Object.entries(images)) {
        if (image.visibility && !image.loaded) return false
      }
      return true
    }

    if (!allImagesLoaded()) return
    else document.getElementById('preview').classList.remove('load')

    for (const [key, image] of Object.entries(images)) {
      if (image?.src && image.visibility) {
        if (key == 'glare') ctx.restore()

        const x = (canvas.width - image.img.width) / 2
        const y = (canvas.height - image.img.height) / 2

        if (key == 'watchface') {
          ctx.save()
          ctx.beginPath()
          if (image?.rounding == "hyperbolic") drawHyperbolicRect(ctx, x, y, images.watchface.width, images.watchface.height, images.watchface.radius)
          else ctx.roundRect(x, y, images.watchface.width, images.watchface.height, images.watchface.radius)
          ctx.closePath()
          ctx.clip()
        }

        ctx.drawImage(image.img, x, y, image.img.width, image.img.height)
      }
    }
  }

  document.getElementById('imagePicker').addEventListener('click', () => document.getElementById('fileInput').click())

  document.querySelectorAll('.checkbox input').forEach((button) => {
    button.addEventListener('click', (event) => {
      const type = event.target.getAttribute('data-type')
      images[type].visibility = event.target.checked
      loadImages()
    })
  })

  document.getElementById('fileInput').addEventListener('change', (event) => {
    file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = function (e) {
        images.watchface.src = e.target.result
        images.watchface.visibility = true
        loadImages()
      }
      reader.readAsDataURL(file)
    }
    event.target.value = null
  })

  document.getElementById('save').addEventListener('click', () => {
    const link = document.createElement('a')
    const input = document.getElementById('fileName')
    link.download = `${input.value ? input.value : input.getAttribute('data-default')}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  })

  const openDeviceListButton = document.getElementById('openDevices')
  const closeDeviceListButton = document.getElementById('closeDevices')
  openDeviceListButton.addEventListener('click', () => {
    openDeviceListButton.classList.add('hide')
    closeDeviceListButton.classList.remove('hide')
    document.getElementById('devices').classList.remove('hide')
  })
  document.getElementById('closeDevices').addEventListener('click', () => {
    document.getElementById('devices').classList.add('hide')
    closeDeviceListButton.classList.add('hide')
    openDeviceListButton.classList.remove('hide')
  })

  document.querySelectorAll('.openModal').forEach(o => {
    o.addEventListener('click', () => {
      document.querySelector('body').style.overflow = 'hidden'
      modal.insertData(o.getAttribute('data-type'))
    })
  })

  function changeBgColor(newColor) {
    document.documentElement.style.setProperty('--background-inner-color', newColor)
  }

  function changeDevice({ brand, model, variant }) {
    document.getElementById('preview').classList.add('load')

    const device = devices[brand].deviceList[model]

    images.bg.src = `./images/bgs/${brand}/${device.bg}${variant ? `_${variant}` : device?.variants ? `_${device.variants[0]}` : ''}.png`
    Object.assign(images.watchface, device.preview)
    const input = document.getElementById('fileName')
    input.setAttribute('placeholder', `${model}_preview`)
    input.setAttribute('data-default', `${model}_preview`)
    if (lastType != device.preview.type) {
      lastType = device.preview.type
      images.watchface.src = `./images/defaults/${lastType}.png`
      images.shadow.src = `./images/shadows/${lastType}.png`
      Object.assign(images.watchface, device.preview)
    }
    const glareCheckbox = document.getElementById('glareCheckbox')
    if (device.preview?.hasGlare) {
      glareCheckbox.parentNode.classList.remove('disable')
      images.glare.src = `./images/glares/${brand}/${device.bg}.png`
      images.glare.visibility = glareCheckbox.checked
    } else {
      glareCheckbox.parentNode.classList.add('disable')
      images.glare.visibility = false
    }
    if (!device.preview?.rounding) delete images.watchface.rounding

    const colorIndex = variant ? device.variants.indexOf(variant) : device?.variants ? 0 : -1
    const newInnerColor = colorIndex >= 0 ? device?.accents[colorIndex] : device?.accent ?? DEFAULT_BG_COLOR
    changeBgColor(newInnerColor)

    localStorage.setItem('device', JSON.stringify({
      brand: brand,
      model: model,
      variant: variant
    }))
    loadImages()
  }

  const localDevice = JSON.parse(localStorage.getItem('device')) ?? {
    brand: "amazfit",
    model: "gtr4"
  }

  fetch('devices.json')
    .then(response => response.json())
    .then(data => {
      devices = data
      const devicesMenu = document.getElementById("devices")
      for (const [brandName, brand] of Object.entries(devices)) {
        const b = document.createElement('div')
        b.classList.add('brand')
        const brandTitle = document.createElement('div')
        brandTitle.innerHTML = brand.title
        brandTitle.classList.add('title', 'button')
        brandTitle.addEventListener('click', e => {
          b.parentNode.querySelectorAll('.title').forEach(t => {
            if (t != e.target) t.classList.remove('active')
            else e.target.classList.toggle('active')
          })
        })
        b.appendChild(brandTitle)
        for (const [deviceModel, device] of Object.entries(brand.deviceList)) {
          const d = document.createElement('div')
          d.classList.add('device', 'button')
          if (localDevice.brand == brandName && localDevice.model == deviceModel) d.classList.add('active')
          d.setAttribute('data-device', deviceModel)
          const display = document.createElement('div')
          display.classList.add('display', device.preview.type)
          const title = document.createElement('div')
          title.innerHTML = device.title
          const model = document.createElement('div')
          model.classList.add('model')
          model.appendChild(display)
          model.appendChild(title)
          d.appendChild(model)
          if (device?.variants) {
            d.classList.remove('button')
            const variants = document.createElement('div')
            variants.classList.add('variants')
            device?.variants.forEach((v, i) => {
              let variant = document.createElement('div')
              variant.classList.add('variant', 'button')
              if (localDevice.brand == brandName && localDevice.model == deviceModel && localDevice?.variant == v) variant.classList.add('active')
              variant.innerHTML = formatVariantName(v)
              variant.addEventListener('click', () => {
                document.getElementById('devices').querySelectorAll('.variant').forEach(t => {
                  if (t != variant) t.classList.remove('active')
                  else variant.classList.add('active')
                })
                changeDevice({ brand: brandName, model: deviceModel, variant: v })
              })
              variants.appendChild(variant)
            })
            d.appendChild(variants)
          }
          d.addEventListener('click', () => {
            b.parentNode.querySelectorAll('.device').forEach(t => {
              if (t != d) {
                t.classList.remove('active')
                t.querySelectorAll('.variant').forEach(v => v.classList.remove('active'))
              } else d.classList.add('active')
            })
            if (!device?.variants) changeDevice({ brand: brandName, model: deviceModel })
          })
          b.appendChild(d)
        }
        devicesMenu.appendChild(b)
      }
      changeDevice(localDevice)
    })
})

const i18n = new I18n({
  defaultLang: 'en',
  fallbackLang: 'en'
})

document.addEventListener('DOMContentLoaded', async () => {
  await i18n.init()

  document.querySelectorAll('.button.lang').forEach(b => {
    b.addEventListener('click', () => i18n.changeLanguage(b.getAttribute('data-lang')))
  })
})