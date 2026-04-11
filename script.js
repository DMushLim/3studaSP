// UTILIDADES
// ==========================

const $ = (id) => document.getElementById(id);

function getParams() {
    const params = new URLSearchParams(window.location.search);
    return Object.fromEntries(params.entries());
}

function redirecionar(url) {
    window.location.href = url;
}

function conteudoTemDados(conteudo) {
    return conteudo.itens?.some(item =>
        (item.textos && item.textos.length > 0) ||
        (item.videos && item.videos.length > 0) ||
        (item.podcasts && item.podcasts.length > 0)
    );
}


// TEMA
// ==========================

function aplicarTema(modo) {
    document.documentElement.classList.toggle('dark', modo === 'dark');
}

function configurarTema() {
    const botao = $('icone-tema');
    if (!botao) return;

    botao.onclick = () => {
        const atual = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        const novo = atual === 'dark' ? 'light' : 'dark';

        localStorage.setItem('tema', novo);
        aplicarTema(novo);
    };

    aplicarTema(localStorage.getItem('tema') || 'light');
}

// DADOS
// ==========================

let dadosCache = null;

async function carregarDados() {
    if (dadosCache) return dadosCache;

    try {
        const res = await fetch('dados.json');
        dadosCache = await res.json();
        return dadosCache;
    } catch (e) {
        console.error('Erro ao carregar JSON:', e);
        return [];
    }
}

// BUSCAS
// ==========================

function encontrarBimestre(dados, id) {
    return dados.find(b => b.id === id);
}

function encontrarDisciplina(bimestre, nome) {
    return (bimestre.disciplinas || []).find(d => d.nome === nome);
}

function encontrarConteudo(disciplina, titulo) {
    return (disciplina.conteudos || []).find(c => c.titulo === titulo);
}

// BIMESTRES
// ==========================

async function carregarBimestres() {
    const dados = await carregarDados();
    const lista = $('lista');
    const topo = $('topo');

    if (!lista || !topo) return;

    lista.innerHTML = '';
    topo.innerHTML = `<h2 class="subtitulo">Selecione um bimestre</h2>`;

    const container = document.createElement('div');
    container.className = 'bimestres';

    dados.forEach(b => {
        const card = criarCard(b.bimestre, 'card card--botao card--roxo-claro card--redondo', () => {
            redirecionar(`disciplinas.html?bimestre=${b.id}`);
        });

        container.appendChild(card);
    });

    lista.appendChild(container);
}

// DISCIPLINAS
// ==========================

async function carregarDisciplinas() {
    const { bimestre } = getParams();
    const dados = await carregarDados();

    const b = encontrarBimestre(dados, bimestre);
    if (!b) return console.error('Bimestre não encontrado');

    const lista = $('lista');
    const topo = $('topo');

    lista.innerHTML = '';
    topo.innerHTML = `<h2 class="subtitulo">Selecione uma disciplina</h2>`;

    lista.innerHTML += `<div class="card card--roxo-claro">Disciplinas</div>`;

    b.disciplinas?.forEach(d => {
        const card = criarCard(d.nome, 'card card--botao card--roxo-escuro', () => {
            redirecionar(`conteudos.html?bimestre=${b.id}&disciplina=${encodeURIComponent(d.nome)}`);
        });

        lista.appendChild(card);
    });
}

// CONTEÚDOS (LISTA)
// ==========================

async function carregarConteudos() {
    const { bimestre, disciplina } = getParams();

    const dados = await carregarDados();
    const b = encontrarBimestre(dados, bimestre);
    if (!b) return;

    const d = encontrarDisciplina(b, decodeURIComponent(disciplina));
    if (!d) return;

    const lista = $('lista');
    const topo = $('topo');
    const inferior = $('extra2');
    const lateral = $('extra');

    // LIMPA TUDO
    lista.innerHTML = '';
    if (lateral) lateral.innerHTML = '';
    if (inferior) inferior.innerHTML = '';

    topo.innerHTML = `<h2 class="subtitulo">Escolha um conteúdo</h2>`;

    // TÍTULO DA DISCIPLINA
    lista.appendChild(criarCard(d.nome, 'card card--roxo-claro'));

    // CONTEÚDOS
    d.conteudos?.forEach(c => {

        const temDados = conteudoTemDados(c);
        const isResumo = c.tipo === 'resumo';

        const classes = isResumo
            ? 'card card--botao card--redondo card--roxo-claro'
            : 'card card--roxo-escuro';

        const card = criarCard(
            c.titulo,
            `card ${temDados ? 'card--botao' : ''} ${classes}`,
            temDados
                ? () => {
                    redirecionar(
                        `conteudo.html?bimestre=${b.id}&disciplina=${encodeURIComponent(d.nome)}&conteudo=${encodeURIComponent(c.titulo)}`
                    );
                }
                : null
        );

        // estilo visual de bloqueado
        if (!temDados) {
            card.style.opacity = '0.8';
            card.style.cursor = 'not-allowed';
        }

        if (isResumo && lateral) {
            lateral.appendChild(card);
        } else {
            lista.appendChild(card);
        }

    });

    // CANAIS DA DISCIPLINA
    if (d.canais?.length && inferior) {

        const subtitulo = document.createElement('h2');
        subtitulo.textContent = 'Canais recomendados';
        subtitulo.className = 'subtitulo';

        const listaCanais = document.createElement('div');
        listaCanais.className = 'lista-canais';

        d.canais.forEach(canal => {
            const a = document.createElement('a');
            a.href = canal.link;
            a.target = '_blank';

            const canalDiv = document.createElement('div');
            canalDiv.className = 'canal';

            const img = document.createElement('img');
            img.src = canal.imagem;
            img.className = 'icone-canal';

            const nome = document.createElement('div');
            nome.textContent = canal.nome;
            nome.className = 'nome-canal';

            canalDiv.appendChild(img);
            canalDiv.appendChild(nome);
            a.appendChild(canalDiv);

            listaCanais.appendChild(a);
        });

        inferior.appendChild(subtitulo);
        inferior.appendChild(listaCanais);
    }

}

// CONTEÚDO FINAL
// ==========================

async function carregarConteudoFinal() {
    const { bimestre, disciplina, conteudo } = getParams();

    const dados = await carregarDados();
    const b = encontrarBimestre(dados, bimestre);
    if (!b) return;

    const d = encontrarDisciplina(b, decodeURIComponent(disciplina));
    if (!d) return;

    const c = encontrarConteudo(d, decodeURIComponent(conteudo));
    if (!c) return;

    const topo = $('topo');
    const colapsaveis = $('colapsaveis');
    const inferior = $('extra2');

    topo.innerHTML = `
        <h1 id="titulo">${d.nome}</h1>
        <h2 class="subtitulo">${c.titulo}</h2>
    `;

    colapsaveis.innerHTML = '';
    if (inferior) inferior.innerHTML = '';

    c.itens?.forEach(item => {

        // TÍTULO DO ITEM (NÃO COLAPSÁVEL)
        const tituloItem = document.createElement('h3');
        tituloItem.textContent = item.titulo;
        tituloItem.style.textAlign = 'center';
        tituloItem.style.marginTop = '20px';

        colapsaveis.appendChild(tituloItem);

        // ===== TEXTOS =====
        if (item.textos?.length) {

            const header = criarCard('Texto', 'card card--roxo-claro card--botao');

            const corpo = document.createElement('div');
            corpo.className = 'conteudo-colapsavel';

            header.onclick = () => corpo.classList.toggle('ativo');

            const containerTextos = document.createElement('div');
            containerTextos.className = 'textos';

            item.textos.forEach(t => {
                const div = document.createElement('div');
                div.innerHTML = t;
                containerTextos.appendChild(div);
            });

            corpo.appendChild(containerTextos);

            colapsaveis.appendChild(header);
            colapsaveis.appendChild(corpo);
        }

        // ===== VÍDEOS =====
        if (item.videos?.length) {

            const header = criarCard('Vídeos', 'card card--roxo-claro card--botao');

            const corpo = document.createElement('div');
            corpo.className = 'conteudo-colapsavel';

            const containerVideos = document.createElement('div');
            containerVideos.className = 'videos';

            header.onclick = () => corpo.classList.toggle('ativo');

            item.videos.forEach(v => {

                if (v.includes('youtube') || v.includes('youtu.be')) {
                    const iframe = document.createElement('iframe');
                    iframe.src = v;
                    iframe.allowFullscreen = true;
                    containerVideos.appendChild(iframe);
                } else {
                    const video = document.createElement('video');
                    video.src = v;
                    video.controls = true;
                    containerVideos.appendChild(video);
                }

            });

            corpo.appendChild(containerVideos);

            colapsaveis.appendChild(header);
            colapsaveis.appendChild(corpo);
        }

        // ===== PODCASTS =====
        if (item.podcasts?.length) {

            const header = criarCard('Podcasts (IA)', 'card card--roxo-claro card--botao');

            const corpo = document.createElement('div');
            corpo.className = 'conteudo-colapsavel';

            const containerPodcasts = document.createElement('div');
            containerPodcasts.className = 'podcasts';

            header.onclick = () => corpo.classList.toggle('ativo');

            item.podcasts.forEach(p => {

                const titulo = document.createElement('h2');
                titulo.className = 'subtitulo';
                titulo.textContent = p.titulo;

                const audio = document.createElement('audio');
                audio.src = p.src;
                audio.controls = true;

                containerPodcasts.appendChild(titulo);
                containerPodcasts.appendChild(audio);
            });

            corpo.appendChild(containerPodcasts);

            colapsaveis.appendChild(header);
            colapsaveis.appendChild(corpo);
        }

    });

}

// COMPONENTES
// ==========================

function criarCard(texto, classes = '', onClick = null) {
    const card = document.createElement('div');
    card.className = `${classes}`;
    card.textContent = texto;

    if (onClick) card.onclick = onClick;

    return card;
}

// INICIALIZAÇÃO
// ==========================

document.addEventListener('DOMContentLoaded', () => {
    configurarTema();

    const pagina = window.location.pathname;

    if (pagina.includes('estudos.html')) carregarBimestres();
    if (pagina.includes('disciplinas.html')) carregarDisciplinas();
    if (pagina.includes('conteudos.html')) carregarConteudos();
    if (pagina.includes('conteudo.html')) carregarConteudoFinal();
});