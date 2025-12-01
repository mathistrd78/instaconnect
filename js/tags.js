// ================================
// TAGS.JS - Gestion des tags
// ================================

const tags = {
    // Configuration des emojis et couleurs disponibles
    // TOUS les emojis iOS dans l'ordre du clavier natif
    availableEmojis: [
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
        '🏳️', '🏴', '🏴‍☠️', '🏁', '🚩', '🏳️‍🌈', '🏳️‍⚧️', '🇺🇳', '🇦🇫', '🇦🇽', '🇦🇱', '🇩🇿',
        '🇦🇸', '🇦🇩', '🇦🇴', '🇦🇮', '🇦🇶', '🇦🇬', '🇦🇷', '🇦🇲', '🇦🇼', '🇦🇺', '🇦🇹', '🇦🇿',
        '🇧🇸', '🇧🇭', '🇧🇩', '🇧🇧', '🇧🇾', '🇧🇪', '🇧🇿', '🇧🇯', '🇧🇲', '🇧🇹', '🇧🇴', '🇧🇦',
        '🇧🇼', '🇧🇷', '🇮🇴', '🇻🇬', '🇧🇳', '🇧🇬', '🇧🇫', '🇧🇮', '🇰🇭', '🇨🇲', '🇨🇦', '🇮🇨',
        '🇨🇻', '🇧🇶', '🇰🇾', '🇨🇫', '🇹🇩', '🇨🇱', '🇨🇳', '🇨🇽', '🇨🇨', '🇨🇴', '🇰🇲', '🇨🇬',
        '🇨🇩', '🇨🇰', '🇨🇷', '🇨🇮', '🇭🇷', '🇨🇺', '🇨🇼', '🇨🇾', '🇨🇿', '🇩🇰', '🇩🇯', '🇩🇲',
        '🇩🇴', '🇪🇨', '🇪🇬', '🇸🇻', '🇬🇶', '🇪🇷', '🇪🇪', '🇸🇿', '🇪🇹', '🇪🇺', '🇫🇰', '🇫🇴',
        '🇫🇯', '🇫🇮', '🇫🇷', '🇬🇫', '🇵🇫', '🇹🇫', '🇬🇦', '🇬🇲', '🇬🇪', '🇩🇪', '🇬🇭', '🇬🇮',
        '🇬🇷', '🇬🇱', '🇬🇩', '🇬🇵', '🇬🇺', '🇬🇹', '🇬🇬', '🇬🇳', '🇬🇼', '🇬🇾', '🇭🇹', '🇭🇳',
        '🇭🇰', '🇭🇺', '🇮🇸', '🇮🇳', '🇮🇩', '🇮🇷', '🇮🇶', '🇮🇪', '🇮🇲', '🇮🇱', '🇮🇹', '🇯🇲',
        '🇯🇵', '🇯🇪', '🇯🇴', '🇰🇿', '🇰🇪', '🇰🇮', '🇽🇰', '🇰🇼', '🇰🇬', '🇱🇦', '🇱🇻', '🇱🇧',
        '🇱🇸', '🇱🇷', '🇱🇾', '🇱🇮', '🇱🇹', '🇱🇺', '🇲🇴', '🇲🇬', '🇲🇼', '🇲🇾', '🇲🇻', '🇲🇱',
        '🇲🇹', '🇲🇭', '🇲🇶', '🇲🇷', '🇲🇺', '🇾🇹', '🇲🇽', '🇫🇲', '🇲🇩', '🇲🇨', '🇲🇳', '🇲🇪',
        '🇲🇸', '🇲🇦', '🇲🇿', '🇲🇲', '🇳🇦', '🇳🇷', '🇳🇵', '🇳🇱', '🇳🇨', '🇳🇿', '🇳🇮', '🇳🇪',
        '🇳🇬', '🇳🇺', '🇳🇫', '🇰🇵', '🇲🇰', '🇲🇵', '🇳🇴', '🇴🇲', '🇵🇰', '🇵🇼', '🇵🇸', '🇵🇦',
        '🇵🇬', '🇵🇾', '🇵🇪', '🇵🇭', '🇵🇳', '🇵🇱', '🇵🇹', '🇵🇷', '🇶🇦', '🇷🇪', '🇷🇴', '🇷🇺',
        '🇷🇼', '🇼🇸', '🇸🇲', '🇸🇹', '🇸🇦', '🇸🇳', '🇷🇸', '🇸🇨', '🇸🇱', '🇸🇬', '🇸🇽', '🇸🇰',
        '🇸🇮', '🇸🇧', '🇸🇴', '🇿🇦', '🇬🇸', '🇰🇷', '🇸🇸', '🇪🇸', '🇱🇰', '🇧🇱', '🇸🇭', '🇰🇳',
        '🇱🇨', '🇵🇲', '🇻🇨', '🇸🇩', '🇸🇷', '🇸🇪', '🇨🇭', '🇸🇾', '🇹🇼', '🇹🇯', '🇹🇿', '🇹🇭',
        '🇹🇱', '🇹🇬', '🇹🇰', '🇹🇴', '🇹🇹', '🇹🇳', '🇹🇷', '🇹🇲', '🇹🇨', '🇹🇻', '🇺🇬', '🇺🇦',
        '🇦🇪', '🇬🇧', '🇺🇸', '🇻🇮', '🇺🇾', '🇺🇿', '🇻🇺', '🇻🇦', '🇻🇪', '🇻🇳', '🇼🇫', '🇪🇭',
        '🇾🇪', '🇿🇲', '🇿🇼', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', '🏴󠁧󠁢󠁷󠁬󠁳󠁿'
    ],

    availableColors: [
        // Roses
        '#fd79a8', '#E1306C', '#d63031',
        // Rouges/Oranges
        '#ff7675', '#ff6348', '#e17055',
        // Jaunes
        '#feca57', '#fdcb6e',
        // Verts
        '#55efc4', '#00cec9', '#00b894',
        // Bleus
        '#74b9ff', '#0984e3',
        // Violets
        '#a29bfe', '#6c5ce7', '#a55eea',
        // Gris
        '#dfe6e9', '#b2bec3', '#636e72', '#2d3436'
    ],

    // État actuel de l'édition
    currentEdit: null,
    currentContext: null,

    // Récupérer tous les tags pour un type donné (supporte l'ancien ET le nouveau système)
    getAllOptions(type) {
        // NOUVEAU SYSTÈME : Chercher dans defaultFields et customFields
        const allFields = [...app.defaultFields, ...app.customFields];
        const field = allFields.find(f => f.id === type);
        
        // Si le champ existe et est de type select
        if (field && field.type === 'select') {
            // Retourner field.tags (même s'il est vide [])
            // IMPORTANT : Ne PAS vérifier field.tags.length > 0
            // Car un tableau vide signifie "nouveau user sans tags"
            if (field.tags !== undefined) {
                return field.tags;
            }
        }
        
        // ANCIEN SYSTÈME (rétrocompatibilité) - utilisé SEULEMENT si field.tags n'existe pas du tout
        // Cela arrive uniquement pour les très anciens users qui n'ont pas encore été migrés
        const defaults = app.defaultTags[type] || [];
        const customs = app.customTags[type] || [];
        
        // Get values that have custom overrides
        const customValues = new Set(customs.map(t => t.value));
        
        // Filter out defaults that have been customized
        const filteredDefaults = defaults.filter(t => !customValues.has(t.value));
        
        // Return filtered defaults + all customs
        return [...filteredDefaults, ...customs];
    },

    // Trouver un tag par valeur
    findTag(type, value) {
        return this.getAllOptions(type).find(opt => opt.value === value);
    },

    // Afficher le dropdown de sélection de tags
    showDropdown(event, contactId, fieldType) {
        event.stopPropagation();
        this.currentContext = { contactId, fieldType };
        const allOptions = this.getAllOptions(fieldType);
        
        this.renderOptions(allOptions);
        
        document.getElementById('overlay').classList.add('active');
        document.getElementById('tagDropdown').classList.add('active');
        
        const searchInput = document.getElementById('tagSearchInput');
        searchInput.value = '';
        // Don't auto-focus to prevent keyboard popup on mobile
        
        searchInput.oninput = () => {
            const filtered = allOptions.filter(opt => 
                opt.label.toLowerCase().includes(searchInput.value.toLowerCase())
            );
            this.renderOptions(filtered, searchInput.value);
        };
    },

    // Rendre les options de tags
    renderOptions(options, searchValue = '') {
        const list = document.getElementById('tagOptionsList');
        
        let html = options.map(opt => `
            <div class="tag-option">
                <div class="tag-option-preview-container" onclick="tags.selectTag('${opt.value.replace(/'/g, "\\'")}')">
                    <span class="tag-option-preview ${opt.class}">${opt.label}</span>
                </div>
                <span class="tag-edit-btn" onclick="tags.openEditModal('${this.currentContext.fieldType}', '${opt.value.replace(/'/g, "\\'")}')">✏️</span>
            </div>
        `).join('');
        
        if (searchValue && !options.find(opt => opt.value.toLowerCase() === searchValue.toLowerCase())) {
            html += `
                <div class="tag-create" onclick="tags.createAndSelect('${searchValue.replace(/'/g, "\\'")}')">
                    <span class="tag-create-icon">+</span>
                    Créer "${searchValue}"
                </div>
            `;
        }
        
        list.innerHTML = html;
    },

    // Sélectionner un tag
    selectTag(value) {
        if (!this.currentContext) return;
        
        // Check if it's a form context
        if (this.currentContext.contactId === 'form') {
            contacts.selectFormTag(value);
            return;
        }
        
        const contact = app.dataStore.contacts.find(c => c.id === this.currentContext.contactId);
        if (contact) {
            contact[this.currentContext.fieldType] = value;
            app.dataStore.save();
            contacts.render();
        }
        
        this.closeDropdown();
    },

    // Créer et sélectionner un nouveau tag
    createAndSelect(value) {
        if (!this.currentContext) return;
        this.addCustomTag(this.currentContext.fieldType, value);
        this.selectTag(value);
    },

    // Ajouter un tag personnalisé
    addCustomTag(type, value) {
        const color = this.availableColors[Math.floor(Math.random() * this.availableColors.length)];
        const className = 'tag-custom-' + Date.now();
        const newTag = {
            value: value,
            label: '🏷️ ' + value,
            class: className,
            color: color
        };
        
        // NOUVEAU SYSTÈME : Ajouter dans field.tags
        const allFields = [...app.defaultFields, ...app.customFields];
        const field = allFields.find(f => f.id === type);
        
        if (field && field.type === 'select') {
            if (!field.tags) field.tags = [];
            field.tags.push(newTag);
            console.log('✅ Tag added to field.tags');
        }
        
        // ANCIEN SYSTÈME : Pour rétrocompatibilité
        if (app.customTags[type]) {
            app.customTags[type].push(newTag);
        }
        
        const style = document.createElement('style');
        style.id = 'style-' + className;
        style.textContent = `.${className} { background: ${color}; color: white; }`;
        document.head.appendChild(style);
        
        app.dataStore.save();
        return newTag;
    },

    // Fermer le dropdown
    closeDropdown() {
        document.getElementById('overlay').classList.remove('active');
        document.getElementById('tagDropdown').classList.remove('active');
        this.currentContext = null;
    },

    // Ouvrir la modale d'édition
    openEditModal(fieldType, value) {
        this.closeDropdown();
        
        // NOUVEAU SYSTÈME : chercher dans field.tags
        const allFields = [...app.defaultFields, ...app.customFields];
        const field = allFields.find(f => f.id === fieldType);
        let tag = null;
        let isDefault = false;
        
        if (field && field.tags) {
            tag = field.tags.find(t => t.value === value);
        }
        
        // Fallback sur l'ancien système si pas trouvé
        if (!tag && app.customTags[fieldType]) {
            tag = app.customTags[fieldType].find(t => t.value === value);
        }
        
        if (!tag && app.defaultTags[fieldType]) {
            tag = app.defaultTags[fieldType].find(t => t.value === value);
            isDefault = true;
        }
        
        if (!tag) {
            console.error('Tag not found:', fieldType, value);
            return;
        }
        
        // Get current color - prefer tag.color if available, otherwise read from CSS
        let currentColor = tag.color || '#868e96'; // Use saved color if exists
        
        if (!currentColor || currentColor === '#868e96') {
            // Fallback: try to read from CSS if color not saved
            const styleElement = document.getElementById('style-' + tag.class);
            if (styleElement) {
                const cssText = styleElement.textContent;
                const match = cssText.match(/background:\s*(#[0-9a-fA-F]{6})/);
                if (match) {
                    currentColor = match[1];
                }
            }
        }
        
        this.currentEdit = { fieldType, value, tag, isDefault, selectedColor: currentColor };
        
        // Rendre les emojis
        const emojiPicker = document.getElementById('emojiPicker');
        const currentEmoji = tag.label.split(' ')[0];
        emojiPicker.innerHTML = this.availableEmojis.map(emoji => `
            <div class="emoji-option ${currentEmoji === emoji ? 'selected' : ''}" 
                 onclick="tags.selectEmoji('${emoji}')">${emoji}</div>
        `).join('');
        
        // Rendre les couleurs avec la couleur actuelle sélectionnée
        const colorPicker = document.getElementById('colorPicker');
        colorPicker.innerHTML = this.availableColors.map(color => `
            <div class="color-option ${color === currentColor ? 'selected' : ''}" 
                 style="background: ${color};"
                 onclick="tags.selectColor('${color}')"></div>
        `).join('');
        
        this.updatePreview();
        
        // Show overlay and modal - overlay BEHIND modal
        document.getElementById('overlay').classList.add('active');
        document.getElementById('tagEditModal').classList.add('active');
    },

    // Sélectionner un emoji
    selectEmoji(emoji) {
        if (!this.currentEdit) return;
        
        const tagName = this.currentEdit.tag.label.replace(/^.+?\s/, '');
        this.currentEdit.tag.label = emoji + ' ' + tagName;
        
        document.querySelectorAll('.emoji-option').forEach(el => el.classList.remove('selected'));
        
        // Find and select the clicked emoji
        const emojiOptions = document.querySelectorAll('.emoji-option');
        emojiOptions.forEach(el => {
            if (el.textContent === emoji) {
                el.classList.add('selected');
            }
        });
        
        this.updatePreview();
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
        
        // ANCIEN SYSTÈME : Supprimer de customTags
        if (app.customTags[fieldType]) {
            app.customTags[fieldType] = app.customTags[fieldType].filter(t => t.value !== value);
        }
        
        // NOUVEAU SYSTÈME : Supprimer de field.tags
        const allFields = [...app.defaultFields, ...app.customFields];
        const field = allFields.find(f => f.id === fieldType);
        if (field && field.tags) {
            field.tags = field.tags.filter(t => t.value !== value);
            console.log(`✅ Tag "${value}" removed from field.tags`);
        }
        
        // Supprimer le style CSS associé
        const tag = this.currentEdit.tag;
        if (tag && tag.class) {
            const styleElement = document.getElementById('style-' + tag.class);
            if (styleElement) {
                styleElement.remove();
                console.log(`✅ CSS style removed for tag "${value}"`);
            }
        }
        
        // Réinitialiser la valeur du tag sur tous les contacts qui l'utilisent
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
        document.getElementById('tagEditModal').classList.remove('active');
        document.getElementById('overlay').classList.remove('active');
        this.currentEdit = null;
    }
};
