(() => {
  // Change this recipient when the permanent contact address is confirmed.
  const recipient = 'gloechacon@gmail.com';
  const form = document.querySelector('#home-consultation, #c-consultation');
  if (!form) return;

  form.action = 'https://formsubmit.co/' + recipient;
  form.method = 'POST';
  const nameInput = form.elements.name;
  const emailInput = form.elements.email;
  nameInput.required = true;
  emailInput.required = true;
  emailInput.type = 'email';
  emailInput.pattern = '[^\\s@]+@[^\\s@.]+(?:\\.[^\\s@.]+)+';
  const validationMessages = {
    en: ['Please enter your name.', 'Enter a valid email, such as name@company.com.'],
    es: ['Escribe tu nombre.', 'Escribe un correo válido, como nombre@empresa.com.'],
    pt: ['Digite seu nome.', 'Digite um e-mail válido, como nome@empresa.com.']
  };
  function validate() {
    const messages = validationMessages[window.rpcI18n?.language] || validationMessages.en;
    nameInput.setCustomValidity(nameInput.value.trim() ? '' : messages[0]);
    emailInput.setCustomValidity('');
    if (!emailInput.value || emailInput.validity.typeMismatch || emailInput.validity.patternMismatch) {
      emailInput.setCustomValidity(messages[1]);
    }
  }
  form.addEventListener('input', validate);
  form.addEventListener('invalid', validate, true);
  document.addEventListener('rpc:language', validate);
  validate();
  const fields = {
    _subject: 'Rainbow Park Collection — New inquiry',
    _template: 'table',
    _url: location.href
  };
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.append(input);
  }


  const messages = {
    en: {
      idle: 'Send your inquiry to the team.',
      sending: 'Sending…',
      accepted: 'The service received your inquiry. Delivery depends on the recipient activating the form.',
      failed: 'We could not confirm delivery. Your information is still here. You can try again or send it using your email app.',
      email: 'Send using my email app',
      submit: 'Send inquiry'
    },
    es: {
      idle: 'Envía tu consulta al equipo.',
      sending: 'Enviando…',
      accepted: 'El servicio recibió tu consulta. La entrega depende de que el destinatario active el formulario.',
      failed: 'No pudimos confirmar el envío. Tus datos siguen aquí. Puedes volver a intentarlo o enviarlos desde tu aplicación de correo.',
      email: 'Enviar desde mi aplicación de correo',
      submit: 'Enviar consulta'
    },
    pt: {
      idle: 'Envie sua consulta à equipe.',
      sending: 'Enviando…',
      accepted: 'O serviço recebeu sua consulta. A entrega depende da ativação do formulário pelo destinatário.',
      failed: 'Não foi possível confirmar o envio. Seus dados continuam aqui. Tente novamente ou envie pelo seu aplicativo de e-mail.',
      email: 'Enviar pelo meu aplicativo de e-mail',
      submit: 'Enviar consulta'
    }
  };
  let state = 'idle';
  const status = form.querySelector('[role="status"]');
  const submit = form.querySelector('button[type="submit"]');
  const fallback = document.createElement('a');
  fallback.hidden = true;
  fallback.style.display = 'none';
  fallback.style.marginTop = '12px';
  fallback.dataset.noTranslate = '';
  status.after(fallback);
  status.dataset.noTranslate = '';
  submit.dataset.noTranslate = '';

  function describe() {
    const labels = messages[window.rpcI18n?.language] || messages.en;
    status.textContent = labels[state];
    submit.textContent = state === 'sending' ? labels.sending : labels.submit;
    fallback.textContent = labels.email;
  }
  function prepareEmail() {
    const data = new FormData(form);
    const body = ['Rainbow Park Collection', 'Name: ' + data.get('name'),
      'Email: ' + data.get('email'), 'Lot: ' + (data.get('lot') ? window.rpcLots.label(data.get('lot')) : '—'),
      'Home: ' + (data.get('house') || '—'), '', data.get('message') || ''].join('\n');
    fallback.href = 'mailto:' + recipient + '?subject=' +
      encodeURIComponent('Rainbow Park Collection — Inquiry') + '&body=' + encodeURIComponent(body);
  }
  form.addEventListener('input', () => {
    if (state === 'failed') prepareEmail();
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (state === 'sending') return;
    validate();
    if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form));
    if (data._honey) return;
    if(data.lot){data.parcel_reference=data.lot;data.lot=window.rpcLots.label(data.lot);}
    state = 'sending';
    submit.disabled = true;
    form.setAttribute('aria-busy', 'true');
    fallback.hidden = true;
    fallback.style.display = 'none';
    describe();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch('https://formsubmit.co/ajax/' + recipient, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', Accept: 'application/json'},
        body: JSON.stringify(data),
        signal: controller.signal
      });
      if (!response.ok) throw new Error('Email service returned HTTP ' + response.status);
      const result = await response.json();
      if (result.success !== true && result.success !== 'true') throw new Error('Submission rejected');
      state = 'accepted';
    } catch (error) {
      console.error('Rainbow Park inquiry failed:', error);
      state = 'failed';
      prepareEmail();
      fallback.hidden = false;
      fallback.style.display = 'inline-block';
    } finally {
      clearTimeout(timer);
      submit.disabled = false;
      form.removeAttribute('aria-busy');
      describe();
    }
  });
  describe();
  document.addEventListener('rpc:language', describe);
})();
