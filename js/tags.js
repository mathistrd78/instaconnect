// ================================
// TAGS.JS - Gestion des tags
// ================================

const tags = {
    // Configuration des emojis et couleurs disponibles
    // Si emoji-keywords.js est chargé, on utilise tous ses emojis
    // Sinon on garde la liste par défaut
    get availableEmojis() {
        if (typeof window.emojiKeywords !== 'undefined') {
            return Object.keys(window.emojiKeywords);
        }
        // Liste par défaut si emoji-keywords.js n'est pas chargé
        return [
            // Smileys & People
            '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊',
        '😇', '🥰', '😍', '🤩', '😘', '😗', '☺️', '😚', '😙', '🥲', '😋', '😛',
        '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑',
        '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷',
        '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳',
        '🥸', '😎', '🤓', '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳',
        '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞',
        '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️',
        '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖', '😺', '😸', '😹', '😻',
        '😼', '😽', '🙀', '😿', '😾',
        
        // Gestures & Body Parts
        '👋', '🤚', '🖐', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘',
        '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛',
        '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾',
        '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀',
        '👁', '👅', '👄', '💋', '🩸',
        
        // People & Fantasy
        '👶', '🧒', '👦', '👧', '🧑', '👨', '👩', '🧔', '🧑‍🦰', '👨‍🦰', '👩‍🦰', '🧑‍🦱',
        '👨‍🦱', '👩‍🦱', '🧑‍🦳', '👨‍🦳', '👩‍🦳', '🧑‍🦲', '👨‍🦲', '👩‍🦲', '👱', '👱‍♂️', '👱‍♀️', '🧓',
        '👴', '👵', '🙍', '🙍‍♂️', '🙍‍♀️', '🙎', '🙎‍♂️', '🙎‍♀️', '🙅', '🙅‍♂️', '🙅‍♀️', '🙆',
        '🙆‍♂️', '🙆‍♀️', '💁', '💁‍♂️', '💁‍♀️', '🙋', '🙋‍♂️', '🙋‍♀️', '🧏', '🧏‍♂️', '🧏‍♀️', '🙇',
        '🙇‍♂️', '🙇‍♀️', '🤦', '🤦‍♂️', '🤦‍♀️', '🤷', '🤷‍♂️', '🤷‍♀️', '🧑‍⚕️', '👨‍⚕️', '👩‍⚕️', '🧑‍🎓',
        '👨‍🎓', '👩‍🎓', '🧑‍🏫', '👨‍🏫', '👩‍🏫', '🧑‍⚖️', '👨‍⚖️', '👩‍⚖️', '🧑‍🌾', '👨‍🌾', '👩‍🌾', '🧑‍🍳',
        '👨‍🍳', '👩‍🍳', '🧑‍🔧', '👨‍🔧', '👩‍🔧', '🧑‍🏭', '👨‍🏭', '👩‍🏭', '🧑‍💼', '👨‍💼', '👩‍💼', '🧑‍🔬',
        '👨‍🔬', '👩‍🔬', '🧑‍💻', '👨‍💻', '👩‍💻', '🧑‍🎤', '👨‍🎤', '👩‍🎤', '🧑‍🎨', '👨‍🎨', '👩‍🎨', '🧑‍✈️',
        '👨‍✈️', '👩‍✈️', '🧑‍🚀', '👨‍🚀', '👩‍🚀', '🧑‍🚒', '👨‍🚒', '👩‍🚒', '👮', '👮‍♂️', '👮‍♀️', '🕵',
        '🕵️‍♂️', '🕵️‍♀️', '💂', '💂‍♂️', '💂‍♀️', '🥷', '👷', '👷‍♂️', '👷‍♀️', '🤴', '👸', '👳',
        '👳‍♂️', '👳‍♀️', '👲', '🧕', '🤵', '🤵‍♂️', '🤵‍♀️', '👰', '👰‍♂️', '👰‍♀️', '🤰', '🤱',
        '👩‍🍼', '👨‍🍼', '🧑‍🍼', '👼', '🎅', '🤶', '🧑‍🎄', '🦸', '🦸‍♂️', '🦸‍♀️', '🦹', '🦹‍♂️',
        '🦹‍♀️', '🧙', '🧙‍♂️', '🧙‍♀️', '🧚', '🧚‍♂️', '🧚‍♀️', '🧛', '🧛‍♂️', '🧛‍♀️', '🧜', '🧜‍♂️',
        '🧜‍♀️', '🧝', '🧝‍♂️', '🧝‍♀️', '🧞', '🧞‍♂️', '🧞‍♀️', '🧟', '🧟‍♂️', '🧟‍♀️', '💆', '💆‍♂️',
        '💆‍♀️', '💇', '💇‍♂️', '💇‍♀️', '🚶', '🚶‍♂️', '🚶‍♀️', '🧍', '🧍‍♂️', '🧍‍♀️', '🧎', '🧎‍♂️',
        '🧎‍♀️', '🧑‍🦯', '👨‍🦯', '👩‍🦯', '🧑‍🦼', '👨‍🦼', '👩‍🦼', '🧑‍🦽', '👨‍🦽', '👩‍🦽', '🏃', '🏃‍♂️',
        '🏃‍♀️', '💃', '🕺', '🕴', '👯', '👯‍♂️', '👯‍♀️', '🧖', '🧖‍♂️', '🧖‍♀️', '🧗', '🧗‍♂️',
        '🧗‍♀️', '🤺', '🏇', '⛷', '🏂', '🏌', '🏌️‍♂️', '🏌️‍♀️', '🏄', '🏄‍♂️', '🏄‍♀️', '🚣',
        '🚣‍♂️', '🚣‍♀️', '🏊', '🏊‍♂️', '🏊‍♀️', '⛹', '⛹️‍♂️', '⛹️‍♀️', '🏋', '🏋️‍♂️', '🏋️‍♀️', '🚴',
        '🚴‍♂️', '🚴‍♀️', '🚵', '🚵‍♂️', '🚵‍♀️', '🤸', '🤸‍♂️', '🤸‍♀️', '🤼', '🤼‍♂️', '🤼‍♀️', '🤽',
        '🤽‍♂️', '🤽‍♀️', '🤾', '🤾‍♂️', '🤾‍♀️', '🤹', '🤹‍♂️', '🤹‍♀️', '🧘', '🧘‍♂️', '🧘‍♀️', '🛀',
        '🛌',
        
        // Family
        '👭', '👫', '👬', '💏', '💑', '👪', '👨‍👩‍👦', '👨‍👩‍👧', '👨‍👩‍👧‍👦', '👨‍👩‍👦‍👦', '👨‍👩‍👧‍👧', '👨‍👨‍👦',
        '👨‍👨‍👧', '👨‍👨‍👧‍👦', '👨‍👨‍👦‍👦', '👨‍👨‍👧‍👧', '👩‍👩‍👦', '👩‍👩‍👧', '👩‍👩‍👧‍👦', '👩‍👩‍👦‍👦', '👩‍👩‍👧‍👧', '👨‍👦',
        '👨‍👦‍👦', '👨‍👧', '👨‍👧‍👦', '👨‍👧‍👧', '👩‍👦', '👩‍👦‍👦', '👩‍👧', '👩‍👧‍👦', '👩‍👧‍👧', '🗣', '👤',
        '👥', '🫂',
        
        // Animals & Nature
        '🐵', '🐒', '🦍', '🦧', '🐶', '🐕', '🦮', '🐕‍🦺', '🐩', '🐺', '🦊', '🦝',
        '🐱', '🐈', '🐈‍⬛', '🦁', '🐯', '🐅', '🐆', '🐴', '🐎', '🦄', '🦓', '🦌',
        '🦬', '🐮', '🐂', '🐃', '🐄', '🐷', '🐖', '🐗', '🐽', '🐏', '🐑', '🐐',
        '🐪', '🐫', '🦙', '🦒', '🐘', '🦣', '🦏', '🦛', '🐭', '🐁', '🐀', '🐹',
        '🐰', '🐇', '🐿', '🦫', '🦔', '🦇', '🐻', '🐻‍❄️', '🐨', '🐼', '🦥', '🦦',
        '🦨', '🦘', '🦡', '🐾', '🦃', '🐔', '🐓', '🐣', '🐤', '🐥', '🐦', '🐧',
        '🕊', '🦅', '🦆', '🦢', '🦉', '🦤', '🪶', '🦩', '🦚', '🦜', '🐸', '🐊',
        '🐢', '🦎', '🐍', '🐲', '🐉', '🦕', '🦖', '🐳', '🐋', '🐬', '🦭', '🐟',
        '🐠', '🐡', '🦈', '🐙', '🐚', '🐌', '🦋', '🐛', '🐜', '🐝', '🪲', '🐞',
        '🦗', '🪳', '🕷', '🕸', '🦂', '🦟', '🪰', '🪱', '🦠', '💐', '🌸', '💮',
        '🏵', '🌹', '🥀', '🌺', '🌻', '🌼', '🌷', '🌱', '🪴', '🌲', '🌳', '🌴',
        '🌵', '🌾', '🌿', '☘️', '🍀', '🍁', '🍂', '🍃',
        
        // Food & Drink
        '🍇', '🍈', '🍉', '🍊', '🍋', '🍌', '🍍', '🥭', '🍎', '🍏', '🍐', '🍑',
        '🍒', '🍓', '🫐', '🥝', '🍅', '🫒', '🥥', '🥑', '🍆', '🥔', '🥕', '🌽',
        '🌶', '🫑', '🥒', '🥬', '🥦', '🧄', '🧅', '🍄', '🥜', '🌰', '🍞', '🥐',
        '🥖', '🫓', '🥨', '🥯', '🥞', '🧇', '🧀', '🍖', '🍗', '🥩', '🥓', '🍔',
        '🍟', '🍕', '🌭', '🥪', '🌮', '🌯', '🫔', '🥙', '🧆', '🥚', '🍳', '🥘',
        '🍲', '🫕', '🥣', '🥗', '🍿', '🧈', '🧂', '🥫', '🍱', '🍘', '🍙', '🍚',
        '🍛', '🍜', '🍝', '🍠', '🍢', '🍣', '🍤', '🍥', '🥮', '🍡', '🥟', '🥠',
        '🥡', '🦀', '🦞', '🦐', '🦑', '🦪', '🍦', '🍧', '🍨', '🍩', '🍪', '🎂',
        '🍰', '🧁', '🥧', '🍫', '🍬', '🍭', '🍮', '🍯', '🍼', '🥛', '☕', '🫖',
        '🍵', '🍶', '🍾', '🍷', '🍸', '🍹', '🍺', '🍻', '🥂', '🥃', '🥤', '🧋',
        '🧃', '🧉', '🧊',
        
        // Activity & Sports
        '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓',
        '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿',
        '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸', '🥌', '🎿', '⛷', '🏂', '🪂',
        '🏋️‍♀️', '🏋️', '🏋️‍♂️', '🤼‍♀️', '🤼', '🤼‍♂️', '🤸‍♀️', '🤸', '🤸‍♂️', '⛹️‍♀️', '⛹️', '⛹️‍♂️',
        '🤺', '🤾‍♀️', '🤾', '🤾‍♂️', '🏌️‍♀️', '🏌️', '🏌️‍♂️', '🏇', '🧘‍♀️', '🧘', '🧘‍♂️', '🏄‍♀️',
        '🏄', '🏄‍♂️', '🏊‍♀️', '🏊', '🏊‍♂️', '🤽‍♀️', '🤽', '🤽‍♂️', '🚣‍♀️', '🚣', '🚣‍♂️', '🧗‍♀️',
        '🧗', '🧗‍♂️', '🚵‍♀️', '🚵', '🚵‍♂️', '🚴‍♀️', '🚴', '🚴‍♂️', '🏆', '🥇', '🥈', '🥉',
        '🏅', '🎖', '🏵', '🎗', '🎫', '🎟', '🎪', '🤹', '🤹‍♂️', '🤹‍♀️', '🎭', '🩰',
        '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🪘', '🎷', '🎺', '🪗', '🎸',
        '🪕', '🎻', '🎲', '♟', '🎯', '🎳', '🎮', '🎰', '🧩',
        
        // Travel & Places
        '🚗', '🚕', '🚙', '🚌', '🚎', '🏎', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚',
        '🚛', '🚜', '🦯', '🦽', '🦼', '🛴', '🚲', '🛵', '🏍', '🛺', '🚨', '🚔',
        '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝', '🚄', '🚅',
        '🚈', '🚂', '🚆', '🚇', '🚊', '🚉', '✈️', '🛫', '🛬', '🛩', '💺', '🛰',
        '🚀', '🛸', '🚁', '🛶', '⛵', '🚤', '🛥', '🛳', '⛴', '🚢', '⚓', '⛽',
        '🚧', '🚦', '🚥', '🚏', '🗺', '🗿', '🗽', '🗼', '🏰', '🏯', '🏟', '🎡',
        '🎢', '🎠', '⛲', '⛱', '🏖', '🏝', '🏜', '🌋', '⛰', '🏔', '🗻', '🏕',
        '⛺', '🛖', '🏠', '🏡', '🏘', '🏚', '🏗', '🏭', '🏢', '🏬', '🏣', '🏤',
        '🏥', '🏦', '🏨', '🏪', '🏫', '🏩', '💒', '🏛', '⛪', '🕌', '🕍', '🛕',
        '🕋', '⛩', '🛤', '🛣', '🗾', '🎑', '🏞', '🌅', '🌄', '🌠', '🎇', '🎆',
        '🌇', '🌆', '🏙', '🌃', '🌌', '🌉', '🌁',
        '🌍', '🌎', '🌏', '🌐', '🗺', '🗾', '🧭', '🏔', '⛰', '🌋',
        
        // Objects
        '⌚', '📱', '📲', '💻', '⌨️', '🖥', '🖨', '🖱', '🖲', '🕹', '🗜', '💾',
        '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽', '🎞', '📞', '☎️', '📟',
        '📠', '📺', '📻', '🎙', '🎚', '🎛', '🧭', '⏱', '⏲', '⏰', '🕰', '⌛',
        '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯', '🪔', '🧯', '🛢', '💸', '💵',
        '💴', '💶', '💷', '🪙', '💰', '💳', '💎', '⚖️', '🪜', '🧰', '🪛', '🔧',
        '🔨', '⚒', '🛠', '⛏', '🪚', '🔩', '⚙️', '🪤', '🧱', '⛓', '🧲', '🔫',
        '💣', '🧨', '🪓', '🔪', '🗡', '⚔️', '🛡', '🚬', '⚰️', '🪦', '⚱️', '🏺',
        '🔮', '📿', '🧿', '💈', '⚗️', '🔭', '🔬', '🕳', '🩹', '🩺', '💊', '💉',
        '🩸', '🧬', '🦠', '🧫', '🧪', '🌡', '🧹', '🪠', '🧺', '🧻', '🚽', '🚰',
        '🚿', '🛁', '🛀', '🧼', '🪥', '🪒', '🧽', '🪣', '🧴', '🛎', '🔑', '🗝',
        '🚪', '🪑', '🛋', '🛏', '🛌', '🧸', '🪆', '🖼', '🪞', '🪟', '🛍', '🛒',
        '🎁', '🎈', '🎏', '🎀', '🪄', '🪅', '🎊', '🎉', '🎎', '🏮', '🎐', '🧧',
        '✉️', '📩', '📨', '📧', '💌', '📥', '📤', '📦', '🏷', '🪧', '📪', '📫',
        '📬', '📭', '📮', '📯', '📜', '📃', '📄', '📑', '🧾', '📊', '📈', '📉',
        '🗒', '🗓', '📆', '📅', '🗑', '📇', '🗃', '🗳', '🗄', '📋', '📁', '📂',
        '🗂', '🗞', '📰', '📓', '📔', '📒', '📕', '📗', '📘', '📙', '📚', '📖',
        '🔖', '🧷', '🔗', '📎', '🖇', '📐', '📏', '🧮', '📌', '📍', '✂️', '🖊',
        '🖋', '✒️', '🖌', '🖍', '📝', '✏️', '🔍', '🔎', '🔏', '🔐', '🔒', '🔓',
        
        // Symbols
        '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹',
        '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️',
        '🕉', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊',
        '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️',
        '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐',
        '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘',
        '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳',
        '🚱', '🔞', '📵', '🚭', '❗', '❕', '❓', '❔', '‼️', '⁉️', '🔅', '🔆',
        '〽️', '⚠️', '🚸', '🔱', '⚜️', '🔰', '♻️', '✅', '🈯', '💹', '❇️', '✳️',
        '❎', '🌐', '💠', 'Ⓜ️', '🌀', '💤', '🏧', '🚾', '♿', '🅿️', '🛗', '🈳',
        '🈂️', '🛂', '🛃', '🛄', '🛅', '🚹', '🚺', '🚼', '⚧', '🚻', '🚮', '🎦',
        '📶', '🈁', '🔣', 'ℹ️', '🔤', '🔡', '🔠', '🆖', '🆗', '🆙', '🆒', '🆕',
        '🆓', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟',
        '🔢', '#️⃣', '*️⃣', '⏏️', '▶️', '⏸', '⏯', '⏹', '⏺', '⏭', '⏮', '⏩',
        '⏪', '⏫', '⏬', '◀️', '🔼', '🔽', '➡️', '⬅️', '⬆️', '⬇️', '↗️', '↘️',
        '↙️', '↖️', '↕️', '↔️', '↪️', '↩️', '⤴️', '⤵️', '🔀', '🔁', '🔂', '🔄',
        '🔃', '🎵', '🎶', '➕', '➖', '➗', '✖️', '🟰', '♾', '💲', '💱', '™️',
        '©️', '®️', '〰️', '➰', '➿', '🔚', '🔙', '🔛', '🔝', '🔜', '✔️', '☑️',
        '🔘', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤', '🔺', '🔻',
        '🔸', '🔹', '🔶', '🔷', '🔳', '🔲', '▪️', '▫️', '◾', '◽', '◼️', '◻️',
        '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '⬛', '⬜', '🟫', '🔈', '🔇', '🔉',
        '🔊', '🔔', '🔕', '📣', '📢', '👁‍🗨', '💬', '💭', '🗯', '♠️', '♣️', '♥️',
        '♦️', '🃏', '🎴', '🀄', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗',
        '🕘', '🕙', '🕚', '🕛', '🕜', '🕝', '🕞', '🕟', '🕠', '🕡', '🕢', '🕣',
        '🕤', '🕥', '🕦', '🕧',
        
        // Flags (sélection)
        '🏁', '🚩', '🎌', '🏴', '🏳️', '🏳️‍🌈', '🏴‍☠️', '🇫🇷', '🇺🇸', '🇬🇧', '🇩🇪', '🇪🇸',
        '🇮🇹', '🇵🇹', '🇧🇪', '🇨🇭', '🇳🇱', '🇨🇦', '🇧🇷', '🇦🇷', '🇲🇽', '🇯🇵', '🇨🇳',
        '🇮🇳', '🇦🇺', '🇷🇺', '🇿🇦'
        ];
    },

    availableColors: [
        // Couleurs principales
        '#E1306C', // Instagram pink (par défaut)
        '#C13584', // Instagram purple
        '#833AB4', // Instagram deep purple
        '#5B51D8', // Instagram blue
        '#405DE6', // Instagram indigo
        
        // Rouges et roses
        '#d63031', // Red
        '#e74c3c', // Alizarin
        '#c0392b', // Pomegranate
        '#e17055', // Burnt Sienna
        '#ff7675', // Light red
        '#fd79a8', // Pink
        
        // Oranges
        '#f39c12', // Orange
        '#e67e22', // Carrot
        '#d35400', // Pumpkin
        '#feca57', // Light orange
        '#ee5a6f', // Coral
        
        // Jaunes
        '#f1c40f', // Sun Flower
        '#fdcb6e', // Mustard
        
        // Verts
        '#27ae60', // Nephritis
        '#2ecc71', // Emerald
        '#00b894', // Mint Leaf
        '#55efc4', // Light cyan
        '#00cec9', // Robin Egg Blue
        
        // Bleus
        '#3498db', // Peter River
        '#2980b9', // Belize Hole
        '#74b9ff', // Light blue
        '#0984e3', // Blue
        '#6c5ce7', // Purple
        
        // Violets et pourpres
        '#9b59b6', // Amethyst
        '#8e44ad', // Wisteria
        '#a29bfe', // Periwinkle
        
        // Gris
        '#95a5a6', // Concrete
        '#7f8c8d', // Asbestos
        '#868e96', // Gray
        '#b2bec3', // Light gray
        
        // Marrons
        '#6c5ce7', // Brown tint
        '#a55eea', // Light purple
        
        // Noir et foncés
        '#2d3436', // Dark gray
        '#636e72'  // Grayish
    ],

    currentEdit: null,

    // Modal de drag & drop pour réorganiser les tags
    openTagOrderModal(fieldType) {
        console.log('🔧 Opening tag order modal for:', fieldType);
        
        const allFields = [...app.defaultFields, ...app.customFields];
        const field = allFields.find(f => f.id === fieldType);
        
        if (!field || !field.tags || field.tags.length === 0) {
            alert('Aucun tag à organiser pour ce champ.');
            return;
        }
        
        const modal = document.createElement('div');
        modal.id = 'tagOrderModal';
        modal.className = 'modal active';
        modal.style.zIndex = '11000';
        
        let tagsHTML = field.tags.map((tag, index) => `
            <div class="tag-order-item" draggable="true" data-index="${index}" data-field="${fieldType}">
                <div class="tag-order-handle">☰</div>
                <div class="tag-order-content">
                    <span class="tag ${tag.class}">${tag.label}</span>
                </div>
                <button class="tag-order-edit" onclick="event.stopPropagation(); tags.openEditModal('${fieldType}', '${tag.value}', true)">✏️</button>
            </div>
        `).join('');
        
        modal.innerHTML = `
            <div class="modal-header">
                <h2>Organiser les tags - ${field.label}</h2>
                <button class="close-btn" onclick="tags.closeTagOrderModal()">✕</button>
            </div>
            <div class="modal-content">
                <p style="color: #868e96; margin-bottom: 16px;">Glissez-déposez pour réorganiser</p>
                <div id="tagOrderList" class="tag-order-list">
                    ${tagsHTML}
                </div>
            </div>
            <div class="form-actions">
                <button class="btn btn-secondary" onclick="tags.closeTagOrderModal()">Annuler</button>
                <button class="btn btn-primary" onclick="tags.saveTagOrder('${fieldType}')">Enregistrer</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.getElementById('overlay').classList.add('active');
        
        // Ajouter les event listeners pour le drag & drop
        this.initDragAndDrop();
    },

    initDragAndDrop() {
        let draggedElement = null;
        
        const items = document.querySelectorAll('.tag-order-item');
        
        items.forEach(item => {
            // Empêcher le drag sur le bouton edit
            const editBtn = item.querySelector('.tag-order-edit');
            if (editBtn) {
                editBtn.addEventListener('mousedown', (e) => {
                    e.stopPropagation();
                });
                editBtn.addEventListener('touchstart', (e) => {
                    e.stopPropagation();
                });
            }
            
            item.addEventListener('dragstart', (e) => {
                draggedElement = item;
                item.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            });
            
            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
                draggedElement = null;
            });
            
            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (draggedElement && draggedElement !== item) {
                    const list = item.parentNode;
                    const draggingIndex = Array.from(list.children).indexOf(draggedElement);
                    const targetIndex = Array.from(list.children).indexOf(item);
                    
                    if (draggingIndex < targetIndex) {
                        item.parentNode.insertBefore(draggedElement, item.nextSibling);
                    } else {
                        item.parentNode.insertBefore(draggedElement, item);
                    }
                }
            });
            
            // Touch events pour mobile
            let touchStartY = 0;
            let touchElement = null;
            
            item.addEventListener('touchstart', (e) => {
                // Ne pas démarrer le drag si on clique sur le bouton edit
                if (e.target.closest('.tag-order-edit')) {
                    return;
                }
                
                touchStartY = e.touches[0].clientY;
                touchElement = item;
                item.classList.add('dragging');
            });
            
            item.addEventListener('touchmove', (e) => {
                if (!touchElement) return;
                e.preventDefault();
                
                const touchY = e.touches[0].clientY;
                const list = item.parentNode;
                const items = Array.from(list.children);
                
                // Trouver l'élément au-dessus duquel on est
                const afterElement = items.find(child => {
                    if (child === touchElement) return false;
                    const box = child.getBoundingClientRect();
                    const offset = touchY - box.top - box.height / 2;
                    return offset < 0;
                });
                
                if (afterElement) {
                    list.insertBefore(touchElement, afterElement);
                } else {
                    list.appendChild(touchElement);
                }
            });
            
            item.addEventListener('touchend', () => {
                if (touchElement) {
                    touchElement.classList.remove('dragging');
                    touchElement = null;
                }
            });
        });
    },

    saveTagOrder(fieldType) {
        const list = document.getElementById('tagOrderList');
        const items = Array.from(list.children);
        
        const allFields = [...app.defaultFields, ...app.customFields];
        const field = allFields.find(f => f.id === fieldType);
        
        if (!field) return;
        
        // Réorganiser field.tags selon le nouvel ordre
        const newOrder = items.map(item => {
            const index = parseInt(item.getAttribute('data-index'));
            return field.tags[index];
        });
        
        field.tags = newOrder;
        
        console.log('💾 Saving new tag order:', newOrder);
        
        app.dataStore.save();
        contacts.render();
        this.closeTagOrderModal();
    },

    closeTagOrderModal() {
        const modal = document.getElementById('tagOrderModal');
        if (modal) modal.remove();
        document.getElementById('overlay').classList.remove('active');
    },

    // Ouvrir la modale d'édition
    openEditModal(fieldType, value, fromOrderModal = false) {
        // Si on vient de la modal d'ordre, la fermer temporairement
        if (fromOrderModal) {
            const orderModal = document.getElementById('tagOrderModal');
            if (orderModal) {
                orderModal.style.display = 'none';
            }
        }
        
        const allFields = [...app.defaultFields, ...app.customFields];
        const field = allFields.find(f => f.id === fieldType);
        
        if (!field) {
            console.error('Field not found:', fieldType);
            return;
        }
        
        // Trouver le tag
        const tag = this.findTag(fieldType, value);
        
        if (!tag) {
            console.error('Tag not found:', value);
            return;
        }
        
        // Vérifier si c'est un tag par défaut
        const isDefault = field.defaultTags && field.defaultTags.some(t => t.value === value);
        
        this.currentEdit = {
            fieldType,
            value,
            tag,
            isDefault,
            selectedColor: tag.color || '#868e96',
            fromOrderModal
        };
        
        // Créer la modal
        const modal = document.createElement('div');
        modal.id = 'tagEditModal';
        modal.className = 'modal active';
        
        // Générer les options de couleurs
        const colorOptionsHTML = this.availableColors.map(color => `
            <div class="color-option ${color === this.currentEdit.selectedColor ? 'selected' : ''}" 
                 style="background: ${color};" 
                 onclick="tags.selectColor('${color}')">
            </div>
        `).join('');
        
        modal.innerHTML = `
            <div class="modal-header">
                <h2>Modifier le tag</h2>
                <button class="close-btn" onclick="tags.closeEditModal()">✕</button>
            </div>
            <div class="modal-content">
                <div class="tag-edit-preview">
                    <label>Aperçu</label>
                    <div id="tagPreview" class="tag" style="background: ${this.currentEdit.selectedColor}; color: white;">
                        ${tag.label}
                    </div>
                </div>
                
                <div class="tag-edit-colors">
                    <label>Couleur</label>
                    <div class="color-grid">
                        ${colorOptionsHTML}
                    </div>
                </div>
                
                ${!isDefault ? `
                <div class="tag-edit-actions">
                    <button class="btn btn-danger" onclick="tags.deleteTag()">Supprimer ce tag</button>
                </div>
                ` : ''}
            </div>
            <div class="form-actions">
                <button class="btn btn-secondary" onclick="tags.closeEditModal()">Annuler</button>
                <button class="btn btn-primary" onclick="tags.saveEdit()">Enregistrer</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.getElementById('overlay').classList.add('active');
    },

    // Sélectionner une couleur
    selectColor(color) {
        if (!this.currentEdit) return;
        
        this.currentEdit.selectedColor = color;
        
        document.querySelectorAll('.color-option').forEach(el => {
            el.classList.remove('selected');
            // Check if this element has the selected color
            const bgColor = el.style.background || el.style.backgroundColor;
            if (bgColor === color || this.normalizeColor(bgColor) === this.normalizeColor(color)) {
                el.classList.add('selected');
            }
        });
        
        this.updatePreview();
    },

    normalizeColor(color) {
        // Convert rgb/rgba to hex if needed
        if (!color) return '';
        return color.toLowerCase().replace(/\s/g, '');
    },

    // Mettre à jour l'aperçu
    updatePreview() {
        if (!this.currentEdit) return;
        
        const preview = document.getElementById('tagPreview');
        preview.textContent = this.currentEdit.tag.label;
        preview.style.background = this.currentEdit.selectedColor || '#868e96';
        preview.style.color = 'white';
    },

    // Sauvegarder l'édition
    saveEdit() {
        if (!this.currentEdit) return;
        
        const { fieldType, value, tag } = this.currentEdit;
        const newColor = this.currentEdit.selectedColor || '#868e96';
        
        console.log('💾 Saving tag edit:', { 
            fieldType, 
            value, 
            label: tag.label, 
            color: newColor,
            currentEdit: this.currentEdit 
        });
        
        // NOUVEAU SYSTÈME : Mettre à jour dans field.tags
        const allFields = [...app.defaultFields, ...app.customFields];
        const field = allFields.find(f => f.id === fieldType);
        
        if (field && field.type === 'select') {
            // Trouver le tag dans field.tags
            const fieldTagIndex = field.tags.findIndex(t => t.value === value);
            
            if (fieldTagIndex >= 0) {
                // Tag existe déjà, le mettre à jour
                console.log('✏️ Updating tag in field.tags');
                field.tags[fieldTagIndex].label = tag.label;
                field.tags[fieldTagIndex].color = newColor;
            } else {
                // Nouveau tag, l'ajouter
                console.log('➕ Adding new tag to field.tags');
                const className = 'tag-custom-' + Date.now();
                field.tags.push({
                    value: value,
                    label: tag.label,
                    class: className,
                    color: newColor
                });
                
                // Créer le style
                const styleElement = document.createElement('style');
                styleElement.id = 'style-' + className;
                document.head.appendChild(styleElement);
                styleElement.textContent = `.${className} { background: ${newColor}; color: white; }`;
            }
        }
        
        // ANCIEN SYSTÈME : Pour rétrocompatibilité (au cas où)
        const existingIndex = app.customTags[fieldType] ? app.customTags[fieldType].findIndex(t => t.value === value) : -1;
        
        let className;
        
        if (existingIndex >= 0) {
            // Custom tag already exists → update it (KEEP THE SAME CLASS!)
            console.log('✏️ Updating existing custom tag at index:', existingIndex);
            
            className = app.customTags[fieldType][existingIndex].class;
            app.customTags[fieldType][existingIndex].label = tag.label;
            app.customTags[fieldType][existingIndex].color = newColor;
        } else if (app.customTags[fieldType]) {
            // New custom tag (first time editing)
            console.log('➕ Creating new custom tag in old system');
            
            className = 'tag-custom-' + Date.now();
            const newTag = {
                value: value,
                label: tag.label,
                class: className,
                color: newColor
            };
            
            app.customTags[fieldType].push(newTag);
        }
        
        // Update or create style for this class (if exists)
        if (className) {
            const styleId = 'style-' + className;
            let styleElement = document.getElementById(styleId);
            if (!styleElement) {
                styleElement = document.createElement('style');
                styleElement.id = styleId;
                document.head.appendChild(styleElement);
            }
            styleElement.textContent = `.${className} { background: ${newColor}; color: white; }`;
        }
        
        console.log('📤 Calling save to Firebase...');
        
        app.dataStore.save();
        contacts.render();
        this.closeEditModal();
    },

    // Supprimer un tag
    deleteTag() {
        if (!this.currentEdit) return;
        
        const { fieldType, value, isDefault } = this.currentEdit;
        
        if (isDefault) {
            alert('Impossible de supprimer un tag par défaut.');
            return;
        }
        
        if (!confirm('Supprimer ce tag ?')) return;
        
        app.customTags[fieldType] = app.customTags[fieldType].filter(t => t.value !== value);
        
        app.dataStore.contacts.forEach(contact => {
            if (contact[fieldType] === value) {
                contact[fieldType] = '';
            }
        });
        
        app.dataStore.save();
        contacts.render();
        this.closeEditModal();
    },

    // Fermer la modale d'édition
    closeEditModal() {
        const modal = document.getElementById('tagEditModal');
        if (modal) modal.remove();
        
        // Si on vient de la modal d'ordre, la réafficher
        if (this.currentEdit && this.currentEdit.fromOrderModal) {
            const orderModal = document.getElementById('tagOrderModal');
            if (orderModal) {
                orderModal.style.display = 'block';
            }
        } else {
            document.getElementById('overlay').classList.remove('active');
        }
        
        this.currentEdit = null;
    }
};

// Exposer tags globalement
window.tags = tags;
