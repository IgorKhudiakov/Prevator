let file = false

const images = {
  bg: {
    src: './images/bgs/amazfit/gtr4.png',
    visibility: true
  },
  watchface: {
    src: './images/defaults/round.png',
    visibility: true,
    width: 314,
    height: 314,
    radius: 157
  },
  shadow: {
    src: './images/shadows/round.png',
    visibility: false
  },
  glare: {
    src: './images/glare.png',
    visibility: false
  }
}

let devices = {}
let lastType = 'round'

document.addEventListener('DOMContentLoaded', function () {

  const canvas = document.getElementById('canvas')
  const ctx = canvas.getContext('2d')

  loadImages()

  function loadImages() {
    for (const [key, imgData] of Object.entries(images)) {
      if (imgData?.src) {
        const img = new Image()
        if (imgData?.width) img.width = `${imgData.width}`
        if (imgData?.height) img.height = `${imgData.height}`
        img.src = imgData.src
        imgData.img = img

        img.onload = () => updateCanvas()
      }
    }
  }

  function updateCanvas() {
    let maxWidth = 0
    let maxHeight = 0
    Object.entries(images).forEach(([key, image]) => {
      if (!image.img) return
      if (image.img.width > maxWidth) maxWidth = image.img.width
      if (image.img.height > maxHeight) maxHeight = image.img.height
    })

    canvas.width = maxWidth
    canvas.height = maxHeight

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    for (const [key, image] of Object.entries(images)) {
      if (image?.src && image.visibility) {
        const x = (maxWidth - image.img.width) / 2
        const y = (maxHeight - image.img.height) / 2

        if (key == 'watchface') {
          ctx.beginPath()
          ctx.roundRect(x, y, image.img.width, image.img.height, image.radius)
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
        brandTitle.classList.add('title')
        brandTitle.addEventListener('click', e => {
          b.parentNode.querySelectorAll('.title').forEach(t => {
            if (t != e.target) t.classList.remove('active')
            else e.target.classList.toggle('active')
          })
        })
        b.appendChild(brandTitle)
        for (const [deviceType, device] of Object.entries(brand.deviceList)) {
          const d = document.createElement('div')
          d.classList.add('device')
          d.setAttribute('data-device', deviceType)
          d.innerHTML = device.title
          d.addEventListener('click', () => {
            b.parentNode.querySelectorAll('.device').forEach(t => {
              if (t != d) t.classList.remove('active')
              else d.classList.toggle('active')
            })
            images.bg.src = `./images/bgs/${brandName}/${device.bg}.png`
            Object.assign(images.watchface, device.preview)
            const input = document.getElementById('fileName')
            input.setAttribute('placeholder', `${deviceType}_preview`)
            input.setAttribute('data-default', `${deviceType}_preview`)
            if (lastType != device.preview.type) {
              lastType = device.preview.type
              // images.watchface.src = `./images/defaults/${lastType}.png`
              images.shadow.src = `./images/shadows/${lastType}.png`
              Object.assign(images.watchface, device.preview)
            }
            loadImages()
          })
          b.appendChild(d)
        }
        devicesMenu.appendChild(b)
      }
    })
})
