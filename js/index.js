function alertErrorConnection() {
  Swal.fire({
    icon: 'error',
    title: 'Oops...',
    text: 'Web Socket Server not connected'
  });
}

function sendMessageOnEnter(e) {
  if (e.keyCode == 13) {
    if (lbus.send(this.value)) {
      this.value = '';
    } else {
      alertErrorConnection();
    }
  }
}

function sendMessageOnClick(e) {
  let le = $('#manual-cmd');

  if (lbus.send(le.value)) {
    le.value = '';
  } else {
    alertErrorConnection();
  }
}


function connectLocalBus(addr, port) {

  addr = (Array.isArray(addr)) ? addr[0] : addr;

  lbus.connect(addr, port);


}
function UARTtoggleButtonState(elB) {

  elToggleClass(elB, 'running');

  let label = $('#serial-connect-label');

  if(elHasClass(elB,'running')){

    label.innerHTML='Running';

  }else{
    
    label.innerHTML='Connect';

  }
}


function toggleButtonState(elB) {

  elToggleClass(elB, 'running');

  let label = $('#ws-connect-label');

  if(elHasClass(elB,'running')){

    label.innerHTML='Running';

  }else{
    
    label.innerHTML='Connect';

  }
}

function renderUARTs(devs){
 
  let el = $('#serial-devices');
  let html='';

  for(let i= devs.length -1; i>=0;i--){

    html+=`<option value="${i}">${devs[i].displayName} => ${devs[i].path}</option>`;
  }
  el.innerHTML=html;
}

let lbus = false;
let server = false;

document.addEventListener('DOMContentLoaded', function () {

  lbus = new LOVEFPGABus();
  server = new Reflector();

  server.getUARTs(renderUARTs);

  $('#ws-connect').addEventListener('click', function (e) {

    if (server) {

      toggleButtonState(this);

      if (server.isConnected()) {

        server.stopWSS();

      } else {

        let leport = $('#ws-port');
        let port = leport.value.trim();

        if (port.length > 0) {

          server.startWSS(port, connectLocalBus);

        } else {

          toggleButtonState(this);

        }

      }
    }
  });

  $('#serial-connect').addEventListener('click', function (e) {

    if (server) {

      UARTtoggleButtonState(this);

      if (server.isUARTConnected()) {

        server.stopUART();

      } else {

        let ledev = $('#serial-devices');
        let dev = ledev.value.trim();

        if (dev.length > 0) {

          server.startUART(dev);

        } else {

          toggleButtonState(this);

        }

      }
    }
  });
  $('#manual-cmd').addEventListener('keydown', sendMessageOnEnter);
  $('#manual-cmd-btn').addEventListener('click', sendMessageOnClick);

});
