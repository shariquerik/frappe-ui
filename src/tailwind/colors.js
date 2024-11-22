let lightModeColors = {
  gray: {
    50: '248 248 248',
    100: '243 243 243',
    200: '237 237 237',
    300: '226 226 226',
    400: '199 199 199',
    500: '153 153 153',
    600: '124 124 124',
    700: '82 82 82',
    800: '56 56 56',
    900: '23 23 23',
  },
  blue: {
    50: '242 249 255',
    100: '230 244 255',
    200: '200 230 255',
    300: '167 215 253',
    400: '115 187 246',
    500: '2 137 247',
    600: '0 123 224',
    700: '0 112 204',
    800: '0 92 163',
    900: '0 72 128',
  },
  amber: {
    50: '253 250 237',
    100: '255 247 211',
    200: '254 237 169',
    300: '251 219 115',
    400: '251 204 85',
    500: '231 153 19',
    600: '219 119 6',
    700: '179 83 9',
    800: '145 64 13',
    900: '118 56 19',
  },
  cyan: {
    50: '245 251 252',
    100: '221 247 255',
    200: '179 232 247',
    300: '153 226 248',
    400: '114 213 243',
    500: '59 189 229',
    600: '50 164 199',
    700: '38 122 148',
    800: '18 92 115',
    900: '22 71 89',
  },
  green: {
    50: '242 253 244',
    100: '228 250 235',
    200: '212 246 222',
    300: '185 238 204',
    400: '155 228 182',
    500: '89 186 139',
    600: '48 166 109',
    700: '39 143 94',
    800: '22 121 76',
    900: '23 59 44',
  },
  orange: {
    50: '255 249 245',
    100: '255 239 228',
    200: '255 222 197',
    300: '255 203 163',
    400: '244 176 127',
    500: '232 108 19',
    600: '212 90 8',
    700: '189 62 12',
    800: '158 53 19',
    900: '107 39 17',
  },
  pink: {
    50: '255 247 252',
    100: '253 232 245',
    200: '255 213 240',
    300: '249 185 224',
    400: '246 167 214',
    500: '227 74 166',
    600: '207 58 150',
    700: '156 38 113',
    800: '128 20 88',
    900: '87 15 62',
  },
  purple: {
    50: '253 250 255',
    100: '246 233 255',
    200: '236 211 255',
    300: '226 185 252',
    400: '207 161 242',
    500: '156 69 227',
    600: '134 66 194',
    700: '110 57 157',
    800: '92 47 131',
    900: '64 24 99',
  },
  red: {
    50: '255 247 247',
    100: '255 231 231',
    200: '255 216 216',
    300: '253 194 194',
    400: '247 149 150',
    500: '224 54 54',
    600: '204 41 41',
    700: '181 42 42',
    800: '148 31 31',
    900: '107 21 21',
  },
  teal: {
    50: '240 253 250',
    100: '230 247 244',
    200: '186 232 225',
    300: '151 222 212',
    400: '115 209 196',
    500: '54 186 173',
    600: '11 158 146',
    700: '15 115 107',
    800: '17 92 87',
    900: '17 69 65',
  },
  violet: {
    50: '251 250 255',
    100: '240 235 255',
    200: '219 213 255',
    300: '201 186 251',
    400: '179 161 245',
    500: '104 70 227',
    600: '95 70 199',
    700: '79 61 161',
    800: '57 41 128',
    900: '37 25 89',
  },
  yellow: {
    50: '255 252 239',
    100: '255 247 211',
    200: '247 233 168',
    300: '245 225 113',
    400: '242 209 75',
    500: '237 186 19',
    600: '209 147 13',
    700: '171 110 5',
    800: '140 86 0',
    900: '115 63 18',
  },
}

let darkModeColors = {
  gray: {
    50: '248 248 248',
    100: '212 212 212',
    200: '175 175 175',
    250: '153 153 153',
    300: '128 128 128',
    400: '113 113 113',
    500: '66 66 66',
    600: '52 52 52',
    650: '43 43 43',
    700: '35 35 35',
    800: '28 28 28',
    900: '15 15 15',
  },
  blue: {
    50: '201 224 245',
    100: '173 210 245',
    200: '140 193 236',
    300: '90 174 242',
    400: '50 148 227',
    500: '21 128 216',
    600: '21 89 153',
    700: '6 61 113',
    800: '5 43 83',
    900: '14 32 55',
  },
  amber: {
    50: '249 232 165',
    100: '248 209 110',
    200: '240 186 49',
    300: '231 153 19',
    400: '197 116 17',
    500: '168 88 9',
    600: '130 65 8',
    700: '96 48 7',
    800: '75 38 6',
    900: '55 30 6',
  },
  cyan: {
    50: '208 240 250',
    100: '160 230 247',
    200: '104 211 243',
    300: '60 184 220',
    400: '43 141 171',
    500: '35 114 139',
    600: '21 82 102',
    700: '14 59 73',
    800: '13 43 54',
    900: '11 37 45',
  },
  green: {
    50: '200 243 222',
    100: '155 230 193',
    200: '120 215 169',
    300: '88 192 142',
    400: '53 174 116',
    500: '31 157 96',
    600: '24 132 80',
    700: '11 97 57',
    800: '10 63 39',
    900: '11 46 28',
  },
  orange: {
    50: '255 205 173',
    100: '255 168 115',
    200: '250 138 64',
    300: '222 109 27',
    400: '196 90 14',
    500: '152 69 9',
    600: '130 57 6',
    700: '104 49 8',
    800: '83 39 7',
    900: '64 31 7',
  },
  pink: {
    50: '246 197 222',
    100: '246 154 209',
    200: '237 119 190',
    300: '227 89 171',
    400: '203 67 148',
    500: '172 55 125',
    600: '130 42 95',
    700: '104 32 75',
    800: '96 29 70',
    900: '71 20 50',
  },
  purple: {
    50: '229 198 251',
    100: '217 175 245',
    200: '201 147 239',
    300: '177 104 232',
    400: '152 75 216',
    500: '122 45 185',
    600: '89 31 137',
    700: '71 23 110',
    800: '57 20 87',
    900: '46 17 70',
  },
  red: {
    50: '255 193 193',
    100: '255 149 149',
    200: '252 116 116',
    300: '235 77 82',
    400: '228 56 56',
    500: '200 40 40',
    600: '156 32 32',
    700: '98 27 24',
    800: '76 24 24',
    900: '54 21 21',
  },
  teal: {
    50: '147 242 232',
    100: '110 231 219',
    200: '82 218 204',
    300: '61 198 184',
    400: '33 156 143',
    500: '27 113 105',
    600: '19 86 79',
    700: '12 66 60',
    800: '11 58 53',
    900: '10 45 41',
  },
  violet: {
    50: '218 203 247',
    100: '196 175 238',
    200: '179 152 239',
    300: '157 124 234',
    400: '136 103 232',
    500: '92 63 194',
    600: '70 57 166',
    700: '51 41 120',
    800: '40 30 93',
    900: '34 28 66',
  },
  yellow: {
    50: '255 232 157',
    100: '248 215 106',
    200: '236 192 46',
    300: '218 174 21',
    400: '198 156 18',
    500: '156 122 10',
    600: '112 86 6',
    700: '91 70 5',
    800: '63 48 4',
    900: '50 38 4',
  },
}

const neutralColors = {
  black: '0 0 0',
  white: '255 255 255',
}

const whiteOverlay = {
  50: '255 255 255 / 0.1',
  100: '255 255 255 / 0.18',
  200: '255 255 255 / 0.27',
  300: '255 255 255 / 0.36',
  400: '255 255 255 / 0.45',
  500: '255 255 255 / 0.54',
  600: '255 255 255 / 0.63',
  700: '255 255 255 / 0.72',
  800: '255 255 255 / 0.81',
  900: '255 255 255 / 0.90',
}

const blackOverlay = {
  50: '0 0 0 / 0.09',
  100: '0 0 0 / 0.18',
  200: '0 0 0 / 0.27',
  300: '0 0 0 / 0.36',
  400: '0 0 0 / 0.45',
  500: '0 0 0 / 0.54',
  600: '0 0 0 / 0.63',
  700: '0 0 0 / 0.72',
  800: '0 0 0 / 0.81',
  900: '0 0 0 / 0.90',
}

function withOpacity(color) {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined && !color.includes('/')) {
      return `rgb(${color} / ${opacityValue})`
    }
    return `rgb(${color})`
  }
}

function getDefaultColorMap(color) {
  let defaultColors = lightModeColors
  let obj = {}
  let keys = [
    '50',
    '100',
    '200',
    '300',
    '400',
    '500',
    '600',
    '700',
    '800',
    '900',
  ]
  keys.forEach((key) => {
    let rgbString = defaultColors[color][key]
    if (color) {
      obj[key] = withOpacity(rgbString)
    }
  })
  return obj
}

function themedCssVariables() {
  return {
    ':root': {
      '--outline-amber-1': lightModeColors.amber[200],
      '--outline-amber-2': lightModeColors.amber[400],
      '--outline-blue-1': lightModeColors.blue[300],
      '--outline-blue-2': lightModeColors.blue[500],
      '--outline-gray-1': lightModeColors.gray[200],
      '--outline-gray-2': lightModeColors.gray[300],
      '--outline-gray-3': lightModeColors.gray[400],
      '--outline-gray-4': lightModeColors.gray[500],
      '--outline-gray-5': lightModeColors.gray[800],
      '--outline-gray-modals': lightModeColors.gray[200],
      '--outline-green-1': lightModeColors.green[300],
      '--outline-green-2': lightModeColors.green[400],
      '--outline-orange-1': lightModeColors.orange[400],
      '--outline-red-1': lightModeColors.red[200],
      '--outline-red-2': lightModeColors.red[300],
      '--outline-red-3': lightModeColors.red[400],
      '--outline-red-4': lightModeColors.red[500],
      '--outline-white': neutralColors.white,
      '--surface-amber-1': lightModeColors.amber[100],
      '--surface-amber-2': lightModeColors.amber[600],
      '--surface-blue-1': lightModeColors.blue[100],
      '--surface-blue-2': lightModeColors.blue[500],
      '--surface-cards': neutralColors.white,
      '--surface-cyan-1': lightModeColors.cyan[100],
      '--surface-gray-1': lightModeColors.gray[50],
      '--surface-gray-2': lightModeColors.gray[100],
      '--surface-gray-3': lightModeColors.gray[200],
      '--surface-gray-4': lightModeColors.gray[300],
      '--surface-gray-5': lightModeColors.gray[700],
      '--surface-gray-6': lightModeColors.gray[800],
      '--surface-gray-7': lightModeColors.gray[900],
      '--surface-green-1': lightModeColors.green[50],
      '--surface-green-2': lightModeColors.green[100],
      '--surface-green-3': lightModeColors.green[600],
      '--surface-menu-bar': lightModeColors.gray[50],
      '--surface-modal': neutralColors.white,
      '--surface-orange-1': lightModeColors.orange[100],
      '--surface-pink-1': lightModeColors.pink[100],
      '--surface-red-1': lightModeColors.red[100],
      '--surface-red-2': lightModeColors.red[200],
      '--surface-red-3': lightModeColors.red[300],
      '--surface-red-4': lightModeColors.red[600],
      '--surface-red-5': lightModeColors.red[700],
      '--surface-red-6': lightModeColors.red[800],
      '--surface-selected': neutralColors.white,
      '--surface-violet-1': lightModeColors.violet[100],
      '--surface-white': neutralColors.white,
      '--text-ink-amber-1': lightModeColors.amber[100],
      '--text-ink-amber-2': lightModeColors.amber[500],
      '--text-ink-amber-3': lightModeColors.amber[600],
      '--text-ink-blue-1': lightModeColors.blue[100],
      '--text-ink-blue-2': lightModeColors.blue[400],
      '--text-ink-blue-3': lightModeColors.blue[600],
      '--text-ink-blue-4': lightModeColors.blue[800],
      '--text-ink-cyan-1': lightModeColors.cyan[500],
      '--text-ink-gray-1': lightModeColors.gray[200],
      '--text-ink-gray-2': lightModeColors.gray[300],
      '--text-ink-gray-3': lightModeColors.gray[400],
      '--text-ink-gray-4': lightModeColors.gray[500],
      '--text-ink-gray-5': lightModeColors.gray[600],
      '--text-ink-gray-6': lightModeColors.gray[700],
      '--text-ink-gray-7': lightModeColors.gray[700],
      '--text-ink-gray-8': lightModeColors.gray[800],
      '--text-ink-gray-9': lightModeColors.gray[900],
      '--text-ink-green-1': lightModeColors.green[50],
      '--text-ink-green-2': lightModeColors.green[600],
      '--text-ink-green-3': lightModeColors.green[800],
      '--text-ink-pink-1': lightModeColors.pink[500],
      '--text-ink-red-1': lightModeColors.red[50],
      '--text-ink-red-2': lightModeColors.red[400],
      '--text-ink-red-3': lightModeColors.red[500],
      '--text-ink-red-4': lightModeColors.red[600],
      '--text-ink-violet-1': lightModeColors.violet[500],
      '--text-ink-white': neutralColors.white,
    },
    "[data-theme='dark']": {
      '--outline-amber-1': darkModeColors.amber[700],
      '--outline-amber-2': darkModeColors.amber[600],
      '--outline-blue-1': darkModeColors.blue[600],
      '--outline-blue-2': darkModeColors.blue[600],
      '--outline-gray-1': darkModeColors.gray[700],
      '--outline-gray-2': darkModeColors.gray[600],
      '--outline-gray-3': darkModeColors.gray[500],
      '--outline-gray-4': darkModeColors.gray[300],
      '--outline-gray-5': darkModeColors.gray[200],
      '--outline-gray-modals': darkModeColors.gray[600],
      '--outline-green-1': darkModeColors.green[700],
      '--outline-green-2': darkModeColors.green[800],
      '--outline-orange-1': darkModeColors.orange[600],
      '--outline-red-1': darkModeColors.red[700],
      '--outline-red-2': darkModeColors.red[800],
      '--outline-red-3': darkModeColors.red[700],
      '--outline-red-4': darkModeColors.red[600],
      '--outline-white': darkModeColors.gray[800],
      '--surface-amber-1': darkModeColors.amber[900],
      '--surface-amber-2': darkModeColors.amber[400],
      '--surface-blue-1': darkModeColors.blue[900],
      '--surface-blue-2': darkModeColors.blue[500],
      '--surface-cards': darkModeColors.gray[800],
      '--surface-cyan-1': darkModeColors.cyan[900],
      '--surface-gray-1': darkModeColors.gray[700],
      '--surface-gray-2': darkModeColors.gray[650],
      '--surface-gray-3': darkModeColors.gray[600],
      '--surface-gray-4': darkModeColors.gray[500],
      '--surface-gray-5': darkModeColors.gray[100],
      '--surface-gray-6': darkModeColors.gray[200],
      '--surface-gray-7': darkModeColors.gray[100],
      '--surface-green-1': darkModeColors.green[900],
      '--surface-green-2': darkModeColors.green[800],
      '--surface-green-3': darkModeColors.green[500],
      '--surface-menu-bar': darkModeColors.gray[900],
      '--surface-modal': darkModeColors.gray[700],
      '--surface-orange-1': `${darkModeColors.orange[900]} / 0.8`,
      '--surface-pink-1': `${darkModeColors.pink[900]} / 0.8`,
      '--surface-red-1': `${darkModeColors.red[900]} / 0.8`,
      '--surface-red-2': `${darkModeColors.red[800]} / 0.9`,
      '--surface-red-3': darkModeColors.red[700],
      '--surface-red-4': darkModeColors.red[400],
      '--surface-red-5': darkModeColors.red[600],
      '--surface-red-6': darkModeColors.red[700],
      '--surface-selected': whiteOverlay[50],
      '--surface-violet-1': darkModeColors.violet[900],
      '--surface-white': darkModeColors.gray[900],
      '--text-ink-amber-1': neutralColors.white,
      '--text-ink-amber-2': darkModeColors.amber[300],
      '--text-ink-amber-3': darkModeColors.amber[400],
      '--text-ink-blue-1': neutralColors.white,
      '--text-ink-blue-2': darkModeColors.blue[500],
      '--text-ink-blue-3': darkModeColors.blue[300],
      '--text-ink-cyan-1': darkModeColors.cyan[300],
      '--text-ink-gray-1': darkModeColors.gray[700],
      '--text-ink-gray-2': darkModeColors.gray[500],
      '--text-ink-gray-3': darkModeColors.gray[400],
      '--text-ink-gray-4': darkModeColors.gray[400],
      '--text-ink-gray-5': darkModeColors.gray[300],
      '--text-ink-gray-6': darkModeColors.gray[250],
      '--text-ink-gray-7': darkModeColors.gray[200],
      '--text-ink-gray-8': darkModeColors.gray[100],
      '--text-ink-gray-9': darkModeColors.gray[50],
      '--text-ink-green-1': neutralColors.white,
      '--text-ink-green-2': darkModeColors.green[400],
      '--text-ink-green-3': darkModeColors.green[200],
      '--text-ink-pink-1': darkModeColors.pink[100],
      '--text-ink-red-1': neutralColors.white,
      '--text-ink-red-2': darkModeColors.red[700],
      '--text-ink-red-3': darkModeColors.red[300],
      '--text-ink-red-4': darkModeColors.red[200],
      '--text-ink-violet-1': darkModeColors.violet[300],
      '--text-ink-white': darkModeColors.gray[900],
    },
  }
}

let semanticColors = {
  // for border color
  outline: {
    'amber-1': withOpacity('var(--outline-amber-1)'),
    'amber-2': withOpacity('var(--outline-amber-2)'),
    'blue-1': withOpacity('var(--outline-blue-1)'),
    'blue-2': withOpacity('var(--outline-blue-2)'),
    'gray-1': withOpacity('var(--outline-gray-1)'),
    'gray-2': withOpacity('var(--outline-gray-2)'),
    'gray-3': withOpacity('var(--outline-gray-3)'),
    'gray-4': withOpacity('var(--outline-gray-4)'),
    'gray-5': withOpacity('var(--outline-gray-5)'),
    'gray-modals': withOpacity('var(--outline-gray-modals)'),
    'green-1': withOpacity('var(--outline-green-1)'),
    'green-2': withOpacity('var(--outline-green-2)'),
    'orange-1': withOpacity('var(--outline-orange-1)'),
    'red-1': withOpacity('var(--outline-red-1)'),
    'red-2': withOpacity('var(--outline-red-2)'),
    'red-3': withOpacity('var(--outline-red-3)'),
    'red-4': withOpacity('var(--outline-red-4)'),
    white: withOpacity('var(--outline-white)'),
  },
  // for background color
  surface: {
    'amber-1': withOpacity('var(--surface-amber-1)'),
    'amber-2': withOpacity('var(--surface-amber-2)'),
    'blue-1': withOpacity('var(--surface-blue-1)'),
    'blue-2': withOpacity('var(--surface-blue-2)'),
    cards: withOpacity('var(--surface-cards)'),
    'cyan-1': withOpacity('var(--surface-cyan-1)'),
    'gray-1': withOpacity('var(--surface-gray-1)'),
    'gray-2': withOpacity('var(--surface-gray-2)'),
    'gray-3': withOpacity('var(--surface-gray-3)'),
    'gray-4': withOpacity('var(--surface-gray-4)'),
    'gray-5': withOpacity('var(--surface-gray-5)'),
    'gray-6': withOpacity('var(--surface-gray-6)'),
    'gray-7': withOpacity('var(--surface-gray-7)'),
    'green-1': withOpacity('var(--surface-green-1)'),
    'green-2': withOpacity('var(--surface-green-2)'),
    'green-3': withOpacity('var(--surface-green-3)'),
    'menu-bar': withOpacity('var(--surface-menu-bar)'),
    modal: withOpacity('var(--surface-modal)'),
    'orange-1': withOpacity('var(--surface-orange-1)'),
    'pink-1': withOpacity('var(--surface-pink-1)'),
    'red-1': withOpacity('var(--surface-red-1)'),
    'red-2': withOpacity('var(--surface-red-2)'),
    'red-3': withOpacity('var(--surface-red-3)'),
    'red-4': withOpacity('var(--surface-red-4)'),
    'red-5': withOpacity('var(--surface-red-5)'),
    'red-6': withOpacity('var(--surface-red-6)'),
    selected: withOpacity('var(--surface-selected)'),
    'violet-1': withOpacity('var(--surface-violet-1)'),
    white: withOpacity('var(--surface-white)'),
  },
  // for text color and svg stroke/fill
  ink: {
    'amber-1': withOpacity('var(--text-ink-amber-1)'),
    'amber-2': withOpacity('var(--text-ink-amber-2)'),
    'amber-3': withOpacity('var(--text-ink-amber-3)'),
    'blue-1': withOpacity('var(--text-ink-blue-1)'),
    'blue-2': withOpacity('var(--text-ink-blue-2)'),
    'blue-3': withOpacity('var(--text-ink-blue-3)'),
    'cyan-1': withOpacity('var(--text-ink-cyan-1)'),
    'gray-1': withOpacity('var(--text-ink-gray-1)'),
    'gray-2': withOpacity('var(--text-ink-gray-2)'),
    'gray-3': withOpacity('var(--text-ink-gray-3)'),
    'gray-4': withOpacity('var(--text-ink-gray-4)'),
    'gray-5': withOpacity('var(--text-ink-gray-5)'),
    'gray-6': withOpacity('var(--text-ink-gray-6)'),
    'gray-7': withOpacity('var(--text-ink-gray-7)'),
    'gray-8': withOpacity('var(--text-ink-gray-8)'),
    'gray-9': withOpacity('var(--text-ink-gray-9)'),
    'green-1': withOpacity('var(--text-ink-green-1)'),
    'green-2': withOpacity('var(--text-ink-green-2)'),
    'green-3': withOpacity('var(--text-ink-green-3)'),
    'pink-1': withOpacity('var(--text-ink-pink-1)'),
    'red-1': withOpacity('var(--text-ink-red-1)'),
    'red-2': withOpacity('var(--text-ink-red-2)'),
    'red-3': withOpacity('var(--text-ink-red-3)'),
    'red-4': withOpacity('var(--text-ink-red-4)'),
    'violet-1': withOpacity('var(--text-ink-violet-1)'),
    white: withOpacity('var(--text-ink-white)'),
  },
}

function colorPalette({ colors }) {
  return {
    inherit: colors.inherit,
    current: colors.current,
    transparent: colors.transparent,
    black: colors.black,
    white: colors.white,
    gray: getDefaultColorMap('gray'),
    blue: getDefaultColorMap('blue'),
    green: getDefaultColorMap('green'),
    red: getDefaultColorMap('red'),
    orange: getDefaultColorMap('orange'),
    yellow: getDefaultColorMap('yellow'),
    teal: getDefaultColorMap('teal'),
    violet: getDefaultColorMap('violet'),
    cyan: getDefaultColorMap('cyan'),
    amber: getDefaultColorMap('amber'),
    pink: getDefaultColorMap('pink'),
    purple: getDefaultColorMap('purple'),
    'white-overlay': (() => {
      let obj = {}
      for (let shade in whiteOverlay) {
        obj[shade] = `rgb(${whiteOverlay[shade]})`
      }
      return obj
    })(),
    'black-overlay': (() => {
      let obj = {}
      for (let shade in blackOverlay) {
        obj[shade] = `rgb(${blackOverlay[shade]})`
      }
      return obj
    })(),
  }
}

module.exports = {
  colorPalette,
  themedCssVariables,
  semanticColors,
}
