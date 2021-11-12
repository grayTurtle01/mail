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
    
    fetch("/emails", {
      method: 'POST',
      body: JSON.stringify({
        'recipients': recipients,
        'subject': subject,
        'body': body
      })
    })
    .then( res => res.json())
    .then( data => console.log(data))  
    .then( () =>  load_mailbox('sent') )
   
    return false
  }

  // Replay Email
  document.querySelector('#replay-form').onsubmit = () => {
    fetch("/emails", {
      method: 'POST',
      body: JSON.stringify({
        recipients: document.querySelector('#replay-recipients').value,
        subject: document.querySelector('#replay-subject').value,
        body: document.querySelector('#replay-body').value
      })
    })
    .then( res => res.json())
    .then( data => console.log(data))
    .then( () => load_mailbox('sent') )
    

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
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#replay-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Show mails
  fetch(`/emails/${mailbox}`)
    .then( res => res.json() )
    .then( mails => {
      //console.log(mails)
      mails.forEach( mail => {

        let div = document.createElement('div')
        

        if( mail.read == false )
          div.className = 'mail'
        else
          div.className = 'mail readed'
 
        let left = document.createElement('div')
        left.id = mail.id
        left.onclick = showMail
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

        left.innerHTML = `<div class="left"><strong class="mr-3">${email} </strong> ${mail.subject} </div>`
        right.innerHTML = `<div><span class='text-secondary mr-3' >${mail.timestamp}</span></div> `

        if(mailbox == 'inbox' || mailbox == 'archive'){
          right.firstChild.append(archive_button)
        }

        div.append(left)
        div.append(right)  

        document.querySelector('#emails-view').append(div)
      })
    })
    .catch( error => console.log(error))


}

function showMail(){
  fetch(`/emails/${this.id}`)
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
          <button class="btn btn-primary" data-id=${this.id} onclick=reply(this) style="float:right"> Reply </button>
        </div>
      `
      fetch(`/emails/${this.id}`, {
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
  })
  mail.style.animationPlayState = 'running'

}

function reply(boton){
  const mail_ID = boton.dataset.id

  fetch(`emails/${mail_ID}`)
    .then( res => res.json() )
    .then( mail => {
      document.querySelector('#replay-recipients').value = mail.sender
      document.querySelector('#replay-subject').value = `Re: ${mail.subject}`  
      
      body_message = `On ${mail.timestamp} ${mail.sender} wrote: \n ${mail.body} 
      _________________________________________________`
      document.querySelector('#replay-body').value = body_message

    })


  document.querySelector('#email-view').style.display = 'none'
  document.querySelector('#replay-view').style.display = 'block'  
}