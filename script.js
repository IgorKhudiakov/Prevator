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

const colors = {
  black: '#212224',
  brown: '#3d1e0a',
  gray: '#414244',
  lime: '#333500',
  mint: '#1e2e2c',
  orange: '#511801',
  red: '#3f0404',
  white: '#888',
}

document.addEventListener('DOMContentLoaded', () => {
  let file = false

  let devices = {}
  let lastType = 'round'

  const canvas = document.getElementById('canvas')
  const ctx = canvas.getContext('2d')

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
          ctx.roundRect(x, y, images.watchface.width, images.watchface.height, images.watchface.radius)
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
      const modal = document.getElementById(o.getAttribute('data-type'))
      modal.classList.remove('hidden')
      modal.classList.add('active')
      const closeButton = document.createElement('div')
      closeButton.innerHTML = `
        <div class="button closeModal">
          <svg version="1.1" viewBox="0 0 24 24" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"
            xmlns:xlink="http://www.w3.org/1999/xlink">
            <path fill="currentColor"
              d="M14.8,12l3.6-3.6c0.8-0.8,0.8-2,0-2.8c-0.8-0.8-2-0.8-2.8,0L12,9.2L8.4,5.6c-0.8-0.8-2-0.8-2.8,0 c-0.8,0.8-0.8,2,0,2.8L9.2,12l-3.6,3.6c-0.8,0.8-0.8,2,0,2.8C6,18.8,6.5,19,7,19s1-0.2,1.4-0.6l3.6-3.6l3.6,3.6 C16,18.8,16.5,19,17,19s1-0.2,1.4-0.6c0.8-0.8,0.8-2,0-2.8L14.8,12z" />
          </svg>
        </div>
      `
      closeButton.addEventListener('click', () => {
        document.querySelector('body').style.overflow = 'auto'
        modal.classList.remove('active')
        setTimeout(() => modal.classList.add('hidden'), 500)
      })
      if (!modal.querySelector('.closeModal')) modal.querySelector('.title').appendChild(closeButton)
    })
  })

  function changeBgColor(newColor) {
    document.documentElement.style.setProperty('--background-inner-new-color', newColor)
    document.body.classList.add('active')
    setTimeout(() => {
      document.documentElement.style.setProperty('--background-inner-color', newColor)
      document.body.classList.remove('active')
    }, 1000)
  }

  function changeDevice(brand, model, device, variant = false, index = 0) {
    document.getElementById('preview').classList.add('load')

    images.bg.src = `./images/bgs/${brand}/${device.bg}${variant ? `_${variant.toLowerCase()}` : device?.variants ? `_${device.variants[0]}` : ''}.png`
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
    if (device.preview?.hasGlare) images.glare.src = `./images/glares/${brand}/${device.bg}.png`
    const glareCheckbox = document.getElementById('glareCheckbox')
    images.glare.visibility = device.preview?.hasGlare ? glareCheckbox.checked : false
    device.preview?.hasGlare ? glareCheckbox.parentNode.classList.remove('disable') : glareCheckbox.parentNode.classList.add('disable')

    const newInnerColor = variant && colors[device.accents[index]] ? colors[device.accents[index]] : colors[device?.accent] ?? '#071022'
    changeBgColor(newInnerColor)

    loadImages()
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
              variant.innerHTML = v
              variant.addEventListener('click', () => {
                document.getElementById('devices').querySelectorAll('.variant').forEach(t => {
                  if (t != variant) t.classList.remove('active')
                  else variant.classList.add('active')
                })
                changeDevice(brandName, deviceModel, device, v, i)
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
            if (!device?.variants) changeDevice(brandName, deviceModel, device)
          })
          b.appendChild(d)
        }
        devicesMenu.appendChild(b)
      }
    })
})
