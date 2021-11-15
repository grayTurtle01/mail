document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);


  // Send Email
  document.querySelector('#compose-form').onsubmit = () => {
    let recipients = document.querySelector('#compose-recipients').value
    let subject = document.querySelector('#compose-subject').value
    let body = document.querySelector('#compose-body').value
    
    let message = ''
    let error = ''

    fetch("/emails", {
      method: 'POST',
      body: JSON.stringify({
        'recipients': recipients,
        'subject': subject,
        'body': body
      })
    })
    .then( res => res.json())
    .then( data => {
      console.log(data)
      message = data.message
      error = data.error
    })  
    .then( () => load_mailbox('sent'))
    .then( () => {
      alerta = document.querySelector('#alert')
      if( error ){
        alerta.className = "alert alert-danger"
        alerta.innerHTML = error
      }
      else if( message ){
        console.log(message)
        alerta.className = "alert alert-success"
        alerta.innerHTML = message

      }
    })

    return false
  }

  // Replay Email
  document.querySelector('#replay-form').onsubmit = () => {
    let message = ''

    fetch("/emails", {
      method: 'POST',
      body: JSON.stringify({
        recipients: document.querySelector('#replay-recipients').value,
        subject: document.querySelector('#replay-subject').value,
        body: document.querySelector('#replay-body').value
      })
    })
    .then( res => res.json())
    .then( data => {
      console.log(data)
      message = data.message
    })
    .then( () => load_mailbox('sent') )
    .then( () => {
      let alerta = document.querySelector('#alert')
      alerta.innerHTML = message
      alerta.className = 'alert alert-success'
    })
    

    return false
  }

  // By default, load the inbox
  load_mailbox('inbox');

  
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  // Focus compose-recipients
  document.querySelector('#compose-recipients').focus()

}

function load_mailbox(mailbox) {
  selected_mails_ids = []

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';
  
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#replay-view').style.display = 'none';



  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Alert Message
  document.querySelector('#emails-view').innerHTML += `<div id="alert"></div>`
  
  // Delete Mails
  document.querySelector('#emails-view').innerHTML += `<div> <button onclick="delete_mails()" disabled id="delete"> Delete </button> </div>`
  

  // Show mails
  fetch(`/emails/${mailbox}`)
    .then( res => res.json() )
    .then( mails => {

      mails.forEach( mail => {

        let div = document.createElement('div')
        

        if( mail.read == false )
          div.className = 'mail'
        else
          div.className = 'mail readed'
 
        let left = document.createElement('div')
        left.id = mail.id

        let right = document.createElement('div')

        let email 
        
        if( mailbox == 'inbox'){
          email = mail.sender
          archive_button = document.createElement('button')
          archive_button.className = "archive btn-secondary"
          archive_button.innerText = "Archive"
          archive_button.id = mail.id
          archive_button.onclick = archive_mail
        }
        else if (mailbox == 'sent')
          email = mail.recipients

        else if( mailbox == 'archive'){
          email = mail.sender
          archive_button = document.createElement('button')
          archive_button.className = "archive btn-secondary"
          archive_button.innerText = "UnArchive"
          archive_button.id = mail.id
          archive_button.onclick = un_archive_mail
        }  
        left.innerHTML = `<div>
                              <input type="checkbox" data-id=${mail.id} onchange="addId(this)" > 
                              <strong class="mr-3 ml-2 pointer" data-id=${mail.id}>${email} </strong>  
                              <span class="pointer" data-id=${mail.id}>${mail.subject}</span> 
                          </div>`

        right.innerHTML = `<div>
                              <span class='text-secondary mr-3 pointer' data-id=${mail.id}>${mail.timestamp}</span>
                          </div> `

        if(mailbox == 'inbox' || mailbox == 'archive'){
          right.firstChild.append(archive_button)
        }

        // div.append(checkbox)
        div.append(left)
        div.append(right)  

  
        document.querySelector('#emails-view').append(div)

        // add showMail function
        document.querySelectorAll('.pointer').forEach( element => {
            element.onclick = showMail
        })
      })
    })
    .catch( error => console.log(error))


}


function showMail(){
  fetch(`/emails/${this.dataset.id}`)
    .then( res => res.json())
    .then( mail => {
      //console.log(mail)

      document.querySelector('#emails-view').style.display = 'none'
      document.querySelector('#email-view').style.display = 'block'

      document.querySelector('#email-view').innerHTML = `
        <div class="col-lg-6">
          <strong>From: </strong> ${mail.sender } <br>
          <strong>To: </strong> ${mail.recipients} <br>
          <strong>Subject: </strong> ${mail.subject} <br>
          <strong>Timestamp: </strong> ${mail.timestamp} <br>
          <textarea style="height:300px; width:100%" disabled>${mail.body}</textarea>
          <br>
          <button class="btn btn-primary" data-id=${this.dataset.id} onclick=reply(this) style="float:right"> Reply </button>
        </div>
      `
      fetch(`/emails/${this.dataset.id}`, {
        method : 'PUT',
        body : JSON.stringify({
          read: true
        })
      })
    })
    .catch(err => console.log(err))
}

function archive_mail(){
  fetch(`/emails/${this.id}`,{
    method: 'PUT',
    body: JSON.stringify({
      archived: true
    })
  })
 
  mail = this.parentNode.parentNode.parentNode
  mail.addEventListener('animationend', () => {
    mail.style.display = 'none'
  })
  mail.style.animationPlayState = 'running'

  // alerta = document.querySelector('#alert')
  // alerta.innerHTML = "Mail Archived"
  // alerta.className = "alert alert-success"

}

function un_archive_mail(){
  fetch(`/emails/${this.id}`,{
    method: 'PUT',
    body: JSON.stringify({
      archived: false
    })
  })
  
  mail = this.parentNode.parentNode.parentNode
  mail.addEventListener('animationend', () => {
    mail.style.display = 'none'

    // alerta = document.querySelector('#alert')
    // alerta.innerHTML = "Mail Unarchived"
    // alerta.className = "alert alert-success"
  })
  mail.style.animationPlayState = 'running'

}

function reply(boton){
  const mail_ID = boton.dataset.id

  fetch(`emails/${mail_ID}`)
    .then( res => res.json() )
    .then( mail => {
      document.querySelector('#replay-recipients').value = mail.sender

      if(mail.subject.slice(0,3) == 'Re:')
        document.querySelector('#replay-subject').value = `${mail.subject}`  
      else
        document.querySelector('#replay-subject').value = `Re: ${mail.subject}`  

      body_message = `On ${mail.timestamp} ${mail.sender} wrote: \n ${mail.body} 
      _________________________________________________`
      document.querySelector('#replay-body').value = body_message

    })


  document.querySelector('#email-view').style.display = 'none'
  document.querySelector('#replay-view').style.display = 'block'  
}

function addId(checkbox){
  if( checkbox.checked ){
    selected_mails_ids.push(checkbox.dataset.id)
    document.querySelector('#delete').disabled = false
  }
  else{
    selected_mails_ids = selected_mails_ids.filter(id => id != checkbox.dataset.id)
    if( selected_mails_ids.length == 0 )
        document.querySelector('#delete').disabled = true  
  }
  // console.log(selected_mails_ids)
}

function delete_mails(){
  //alert(selected_mails_ids)
  fetch("/delete_mails",{
    method: 'POST',
    body: JSON.stringify(selected_mails_ids)
  })
    .then( res => res.text())
    .then( data => console.log(data))
    .then( () => load_mailbox('inbox'))
}