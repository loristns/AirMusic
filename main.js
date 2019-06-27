let message = document.querySelector('#message')
let video = document.querySelector('#video')

let canvas = document.querySelector('#canvas')
let context = canvas.getContext('2d')

context.strokeStyle = 'green'
context.font = '25px'
context.fillStyle = "green"

function play_drum(sound) {
    const audio = document.querySelector(`audio[data-key="${sound}"]`)
    audio.currentTime = 0
    audio.play()
}

navigator.mediaDevices.getUserMedia({video: true}).then((stream) => {video.srcObject = stream});

// Define what green is.
tracking.ColorTracker.registerColor('green', (r, g, b) => {
    return (g > r + 20 && g > b + 20 && g > 1.25*r && g > 1.25*b)
})

let color_tracker = new tracking.ColorTracker(['green'], 5)

let trigger_seen = false
let last_positions = {'left+': 0, 'left': 0, 'center': 0, 'right': 0, 'right+': 0}
let last_tstate = {'left+': false, 'left': false, 'center': false, 'right': false, 'right+': false}


color_tracker.on('track', (event) => {
    let tstate = {'left+': false, 'left': false, 'center': false, 'right': false, 'right+': false}
    context.clearRect(0, 0, canvas.width, canvas.height)

    if (event.data.length == 0) {
        message.innerHTML = "Trigger not detected."
    } else {
        if (event.data.length == 5) {
            message.innerHTML = "Trigger detected."
            trigger_seen = true
            last_tstate = {'left+': false, 'left': false, 'center': false, 'right': false, 'right+': false}
            
            data = event.data.sort((a, b) => a.x-b.x)
            last_positions['left+'] = data[0].x
            last_positions['left'] = data[1].x
            last_positions['center'] = data[2].x
            last_positions['right'] = data[3].x
            last_positions['right+'] = data[4].x

        } else {
            event.data.forEach(rect => {
                let nearest = ''
                let nearest_dist = 9999

                for (let pos_idx in last_positions) {
                    let pos = last_positions[pos_idx]
                    let distance = Math.abs(rect.x - pos)

                    if (nearest_dist >= distance) {
                        nearest = pos_idx
                        nearest_dist = distance
                    }
                }

                tstate[nearest] = true

                context.strokeRect(rect.x, rect.y, rect.width, rect.height)
                context.fillText(nearest, rect.x + rect.width / 2 - 20, rect.y + rect.height + 10)
            })
            
            let status = `Trigger : left+ (${tstate['left+']}), left (${tstate['left']}), center (${tstate['center']}), right (${tstate['right']}), right+ (${tstate['right+']})`
            message.innerHTML = status
            if (JSON.stringify(last_tstate) != JSON.stringify(tstate)) {

                if (tstate['left+'] == false) {
                    play_drum('hihat')
                }
                if (tstate['left'] == false) {
                    play_drum('snare')
                }
                if (tstate['center'] == false) {
                    play_drum('kick')
                }
                if (tstate['right'] == false) {
                    play_drum('tom')
                }

                if (tstate['right+'] == false) {
                    play_drum('ride')
                }
            }
            last_tstate = tstate
        }
    }
})

tracking.track('#video', color_tracker)