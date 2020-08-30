module.exports = [
    {
        testValue: /(Int)/,
        replace: 'Boolean'
    },
    {
        testKey: /numberRange/,
        testValue: /\s@rsc/,
        replace: ''
    },
    {
        testKey: /(email)/,
        replace: '$1er'
    }
]
