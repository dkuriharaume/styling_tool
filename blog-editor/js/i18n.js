/**
 * Blog Editor i18n Translations
 */

(() => {
  const translations = {
    en: {
      export: {
        label: 'Copy HTML',
        desc: 'Export as HTML code'
      },
      status: {
        autoSave: 'Auto-save enabled',
        loaded: 'Loaded',
        pageLoaded: 'Page loaded',
        saving: 'Saving...',
        saved: 'Saved'
      },
      fileOps: {
        recent: 'Recent Files',
        current: 'Current',
        document: 'Document',
        newDraft: 'New Draft',
        newDraftDesc: 'Create a new draft with title',
        openDraft: 'Open Draft',
        openDraftDesc: 'Browse and open saved drafts',
        saveAs: 'Save As',
        saveAsDesc: 'Save a copy with new name'
      },
      palette: {
        headers: 'Headers',
        text: 'Text',
        lists: 'Lists',
        cards: 'Cards',
        unordered: 'Unordered',
        ordered: 'Ordered',
        orderedTitle: 'Ordered w/ Title',
        dictionary: 'Dictionary'
      },
      properties: {
        header: 'Header',
        level: 'Level',
        paragraph: 'Paragraph',
        list: 'List',
        card: 'Cards',
        columns: 'Columns',
        cards: 'Card Items',
        cardsNote: 'Edit card content in the canvas or adjust fields below.',
        addCard: '+ Add Card',
        type: 'Type',
        items: 'Items',
        itemsNote: 'Edit list items directly in the canvas. Use buttons below to add/remove items.',
        addItem: '+ Add Item',
        deleteBlock: 'Delete Block'
      }
    },
    ja: {
      export: {
        label: 'HTML エクスポート',
        desc: 'HTMLコードとして出力'
      },
      status: {
        autoSave: '編集内容は自動でセーブされます',
        loaded: '読み込み完了',
        pageLoaded: 'ページ読み込み完了',
        saving: '保存中...',
        saved: '保存しました'
      },
      fileOps: {
        recent: '最近使用したファイル',
        current: '現在',
        document: 'ドキュメント',
        newDraft: '新規ドラフト',
        newDraftDesc: 'タイトル付きの新規ドラフトを作成',
        openDraft: 'ドラフトを開く',
        openDraftDesc: '保存済みのドラフトを参照して開く',
        saveAs: '名前を付けて保存',
        saveAsDesc: '新しい名前でコピーを保存'
      },
      palette: {
        headers: '見出し',
        text: 'テキスト',
        lists: 'リスト',
        cards: 'カード',
        unordered: '箇条書き',
        ordered: '番号付き',
        orderedTitle: '番号付き（タイトル有）',
        dictionary: '用語集'
      },
      properties: {
        header: '見出し',
        level: 'レベル',
        paragraph: '段落',
        list: 'リスト',
        card: 'カード',
        columns: '列数',
        cards: 'カード項目',
        cardsNote: 'カード内容はキャンバスで直接編集するか、以下の入力欄で調整できます。',
        addCard: '+ カードを追加',
        type: 'タイプ',
        items: '項目',
        itemsNote: 'リスト項目はキャンバス上で直接編集できます。以下のボタンで項目を追加・削除できます。',
        addItem: '+ 項目を追加',
        deleteBlock: 'ブロックを削除'
      }
    }
  };

  window.BLOG_EDITOR_I18N = { translations };
})();
