let file = false

const images = {
  bg: {
    src: './images/bgs/gtr4.png',
    visibility: true
  },
  watchface: {
    src: './images/default.png',
    visibility: true,
    width: 314,
    height: 314,
    radius: 157
  },
  shadow: {
    src: './images/shadow.png',
    visibility: false
  },
  glare: {
    src: './images/glare.png',
    visibility: false
  }
}

let devices = {}
fetch('devices.json')
  .then(response => response.json())
  .then(data => devices = data)

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

    // ctx.clearRect(0, 0, canvas.width, canvas.height)

    for (const [key, image] of Object.entries(images)) {
      if (image?.src && image.visibility) {
        const x = (maxWidth - image.img.width) / 2
        const y = (maxHeight - image.img.height) / 2

        if (key == 'watchface') {
          const centerX = canvas.width / 2
          const centerY = canvas.height / 2
          ctx.beginPath()
          ctx.arc(centerX, centerY, image.radius, 0, Math.PI * 2)
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

  document.querySelectorAll('#devices > *').forEach((device) => {
    device.addEventListener('click', (event) => {
      const deviceType = event.target.getAttribute('data-device')
      images.bg.src = `./images/bgs/${devices[deviceType].bg}.png`
      Object.assign(images.watchface, devices[deviceType].preview)
      document.getElementById('fileName').setAttribute('placeholder', `${deviceType}_preview`)
      loadImages()
    })
  })
})
