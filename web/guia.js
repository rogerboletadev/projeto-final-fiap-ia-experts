(function () {
  var FONTES = { prompt: N8N_PROMPT, codigo: N8N_CODE };

  document.getElementById('cod-prompt').textContent = N8N_PROMPT;
  document.getElementById('cod-code').textContent = N8N_CODE;

  function copiarTexto(txt) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(txt);
    }
    return new Promise(function (ok, falha) {
      var t = document.createElement('textarea');
      t.value = txt;
      t.setAttribute('readonly', '');
      t.style.position = 'fixed';
      t.style.opacity = '0';
      document.body.appendChild(t);
      t.select();
      try { document.execCommand('copy') ? ok() : falha(); } catch (e) { falha(e); }
      document.body.removeChild(t);
    });
  }

  Array.prototype.forEach.call(document.querySelectorAll('.copiar'), function (btn) {
    var original = btn.textContent;
    btn.addEventListener('click', function () {
      var txt = btn.getAttribute('data-fonte')
        ? FONTES[btn.getAttribute('data-fonte')]
        : document.getElementById(btn.getAttribute('data-alvo')).textContent;
      copiarTexto(txt).then(function () {
        btn.textContent = 'Copiado';
        btn.classList.add('ok');
      }, function () {
        btn.textContent = 'Selecione e copie à mão';
      }).then(function () {
        setTimeout(function () { btn.textContent = original; btn.classList.remove('ok'); }, 1800);
      });
    });
  });
})();
