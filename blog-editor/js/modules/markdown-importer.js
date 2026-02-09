/**
 * Blog Editor Markdown Importer Module
 * Converts Markdown (M2H:OM style rules) into editor blocks.
 */

(() => {
  const modules = window.BLOG_EDITOR_MODULES || {};

  const PLACEHOLDER_IMG = 'https://www.linkey-lock.com/wp-content/uploads/2025/05/2634fefd9b745aa48f169e9a26c89cf8-1.png';

  const normalizeMarkdown = (text) => {
    if (!text) return '';
    let content = text.replace(/\r\n/g, '\n');
    const lines = content.split('\n');
    if (lines.length && lines[0].startsWith('M2O:')) {
      lines.shift();
    }
    return lines.join('\n');
  };

  const applyWordpressShortcodes = (text) => {
    return text
      .replace(/\{TOC\}/g, '[goto]')
      .replace(/\{article-(\d{4})\}/g, '[parts template="related-column-card" post_id=$1]');
  };

  const convertInline = (text) => {
    if (!text) return '';
    let output = applyWordpressShortcodes(text);

    output = output.replace(/\*\*([^*]+?)\*\*(?:\s*\{(info|warning)\})?/g, (match, content, preset) => {
      const cleanContent = content.replace(/\s*\{(info|warning)\}\s*/g, '').trim();
      if (preset === 'info') {
        return `<strong class="strong strong--info">${cleanContent}</strong>`;
      }
      if (preset === 'warning') {
        return `<strong class="strong strong--warning">${cleanContent}</strong>`;
      }
      return `<strong class="strong">${cleanContent}</strong>`;
    });

    output = output.replace(/\[([^\]]+)]\(([^)]+)\)/g, (match, label, url) => {
      return `<a class="txtlink" target="_blank" rel="noopener" href="${url}">${label}</a>`;
    });

    output = output.replace(/(^|[\s(])((https?:\/\/[^\s<>()]+))/g, (match, lead, url) => {
      return `${lead}<a class="txtlink" target="_blank" rel="noopener" href="${url}">${url}</a>`;
    });

    return output;
  };

  const isHeading = (line) => /^#{1,4}\s+/.test(line);
  const isOrderedList = (line) => /^\d+\.\s+/.test(line);
  const isUnorderedList = (line) => /^[-*]\s+/.test(line);
  const isCardStart = (line) => /^<div>\{card-(2|3)\}\s*$/i.test(line);

  const parseHeader = (line) => {
    const match = line.match(/^(#{1,4})\s+(.+)$/);
    if (!match) return null;
    const level = match[1].length;
    let content = match[2].trim();
    let preset = 'default';
    const presetMatch = content.match(/\{(red|blue)\}/i);
    if (presetMatch) {
      preset = presetMatch[1].toLowerCase();
      content = content.replace(/\s*\{(red|blue)\}\s*/i, '').trim();
    }
    return {
      type: 'header',
      level,
      preset,
      content: convertInline(content)
    };
  };

  const parseUnorderedList = (lines, startIndex) => {
    const items = [];
    let i = startIndex;
    while (i < lines.length && isUnorderedList(lines[i].trim())) {
      const raw = lines[i].trim().replace(/^[-*]\s+/, '');
      items.push(raw);
      i += 1;
    }

    const isDictionary = items.some(item => item.includes(' : '));
    if (isDictionary) {
      return {
        block: {
          type: 'list',
          listType: 'dl',
          items: items.map(item => {
            const [term, definition = ''] = item.split(' : ', 2);
            return {
              term: convertInline((term || '').trim()),
              definition: convertInline((definition || '').trim())
            };
          })
        },
        nextIndex: i
      };
    }

    return {
      block: {
        type: 'list',
        listType: 'ul',
        items: items.map(item => ({ content: convertInline(item.trim()) }))
      },
      nextIndex: i
    };
  };

  const parseOrderedList = (lines, startIndex) => {
    const items = [];
    let i = startIndex;
    let hasTitleItems = false;

    while (i < lines.length && isOrderedList(lines[i].trim())) {
      const raw = lines[i].trim().replace(/^\d+\.\s+/, '');
      const titleMatch = raw.match(/^####\s+(.+)$/);

      if (titleMatch) {
        hasTitleItems = true;
        const title = titleMatch[1].trim();
        const contentLines = [];
        let j = i + 1;
        while (j < lines.length && (/^\s{2,}\S/.test(lines[j]) || /^\t\S/.test(lines[j]))) {
          contentLines.push(lines[j].trim());
          j += 1;
        }
        items.push({
          title: convertInline(title),
          content: convertInline(contentLines.join(' '))
        });
        i = j;
      } else {
        items.push({ content: convertInline(raw.trim()) });
        i += 1;
      }
    }

    if (hasTitleItems) {
      return {
        block: {
          type: 'list',
          listType: 'ol-title',
          items: items.map(item => ({
            title: item.title || item.content || '',
            content: item.content && item.title ? item.content : ''
          }))
        },
        nextIndex: i
      };
    }

    return {
      block: {
        type: 'list',
        listType: 'ol',
        items: items.map(item => ({ content: item.content || '' }))
      },
      nextIndex: i
    };
  };

  const parseCardBlock = (lines, startIndex) => {
    const match = lines[startIndex].trim().match(/^<div>\{card-(2|3)\}\s*$/i);
    const subtype = match && match[1] === '3' ? '3-col' : '2-col';
    const innerLines = [];
    let i = startIndex + 1;

    while (i < lines.length && !/^<\/div>\s*$/.test(lines[i].trim())) {
      innerLines.push(lines[i]);
      i += 1;
    }

    const cards = [];
    let currentTitle = null;
    let currentContent = [];

    const flushCard = () => {
      if (!currentTitle && currentContent.length === 0) return;
      const title = currentTitle || `Card ${cards.length + 1}`;
      const content = convertInline(currentContent.join(' ').trim());
      cards.push({
        title: convertInline(title),
        content,
        image: PLACEHOLDER_IMG,
        alt: ''
      });
      currentTitle = null;
      currentContent = [];
    };

    innerLines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;
      if (/^##\s+/.test(trimmed)) {
        flushCard();
        currentTitle = trimmed.replace(/^##\s+/, '').trim();
        return;
      }
      currentContent.push(trimmed);
    });

    flushCard();

    return {
      block: {
        type: 'card',
        subtype,
        cards: cards.length ? cards : [{
          title: 'Card 1',
          content: '',
          image: PLACEHOLDER_IMG,
          alt: ''
        }]
      },
      nextIndex: Math.min(i + 1, lines.length)
    };
  };

  const parseParagraph = (lines, startIndex) => {
    const contentLines = [];
    let i = startIndex;

    while (i < lines.length) {
      const raw = lines[i];
      const trimmed = raw.trim();
      if (!trimmed) break;
      if (isHeading(trimmed) || isOrderedList(trimmed) || isUnorderedList(trimmed) || isCardStart(trimmed)) break;
      contentLines.push(trimmed);
      i += 1;
    }

    let content = contentLines.join(' ').trim();
    let variant = 'normal';
    const smallMatch = content.match(/^\{(small(?:-gray)?)\}\s*/i);
    if (smallMatch) {
      variant = smallMatch[1].toLowerCase();
      content = content.replace(/^\{small(?:-gray)?\}\s*/i, '').trim();
    }

    return {
      block: {
        type: 'paragraph',
        variant,
        content: convertInline(content)
      },
      nextIndex: i
    };
  };

  const parseMarkdownToBlocks = (markdownText) => {
    const content = normalizeMarkdown(markdownText);
    const lines = content.split('\n');
    const blocks = [];

    let i = 0;
    while (i < lines.length) {
      const trimmed = (lines[i] || '').trim();
      if (!trimmed) {
        i += 1;
        continue;
      }

      if (isCardStart(trimmed)) {
        const { block, nextIndex } = parseCardBlock(lines, i);
        if (block) blocks.push(block);
        i = nextIndex;
        continue;
      }

      if (isHeading(trimmed)) {
        const header = parseHeader(trimmed);
        if (header) blocks.push(header);
        i += 1;
        continue;
      }

      if (isOrderedList(trimmed)) {
        const { block, nextIndex } = parseOrderedList(lines, i);
        if (block) blocks.push(block);
        i = nextIndex;
        continue;
      }

      if (isUnorderedList(trimmed)) {
        const { block, nextIndex } = parseUnorderedList(lines, i);
        if (block) blocks.push(block);
        i = nextIndex;
        continue;
      }

      const { block, nextIndex } = parseParagraph(lines, i);
      if (block) blocks.push(block);
      i = nextIndex;
    }

    return blocks;
  };

  modules.markdownImporter = {
    parseMarkdownToBlocks
  };

  window.BLOG_EDITOR_MODULES = modules;
})();
