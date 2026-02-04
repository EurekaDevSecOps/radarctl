import { execSync } from 'node:child_process'

const types = [
  'build',
  'chore',
  'ci',
  'deps',
  'docs',
  'feat',
  'fix',
  'perf',
  'refactor',
  'revert',
  'style',
  'test',
]
const scopes = {
  default: [],
}

// Infer the issue number from the current branch name.
// @tip: git branch name = feat/PE-123 => default issue = PE-123
const issue = execSync('git rev-parse --abbrev-ref HEAD').toString().trim().split('/').at(-1)

const Configuration = {
  /*
   * Resolve and load @commitlint/config-conventional from node_modules.
   * Referenced packages must be installed
   */
  extends: ['@commitlint/config-conventional'],
  /*
   * Resolve and load conventional-changelog-atom from node_modules.
   * Referenced packages must be installed
   */
  parserPreset: 'conventional-changelog-conventionalcommits',
  /*
   * Resolve and load @commitlint/format from node_modules.
   * Referenced package must be installed
   */
  formatter: '@commitlint/format',
  /*
   * Any rules defined here will override rules from @commitlint/config-conventional
   */
  rules: {
    'type-enum': [2, 'always', types],
    'scope-enum': [2, 'always', scopes.default],
    'body-case': [2, 'always', 'sentence-case'],
  },
  /*
   * Array of functions that return true if commitlint should ignore the given message.
   * Given array is merged with predefined functions, which consist of matchers like:
   *
   * - 'Merge pull request', 'Merge X into Y' or 'Merge branch X'
   * - 'Revert X'
   * - 'v1.2.3' (ie semver matcher)
   * - 'Automatic merge X' or 'Auto-merged X into Y'
   *
   * To see full list, check https://github.com/conventional-changelog/commitlint/blob/master/%40commitlint/is-ignored/src/defaults.ts.
   * To disable those ignores and run rules always, set `defaultIgnores: false` as shown below.
   */
  ignores: [(commit) => commit === ''],
  /*
   * Whether commitlint uses the default ignore rules, see the description above.
   */
  defaultIgnores: true,
  /*
   * Custom URL to show upon failure
   */
  helpUrl: 'https://github.com/conventional-changelog/commitlint/#what-is-commitlint',
  /*
   * Custom prompt configs
   */
  prompt: {
    messages: {
      type: "Select the TYPE of change that you're committing",
      scope: 'What is the SCOPE of this change',
      customScope: 'Type in the SCOPE of this change:',
      subject: 'Write a SHORT, IMPERATIVE tense description of the change:\n',
      body: 'Provide a LONGER description of the change (optional). Use "|" to break new line:\n',
      breaking: 'List any BREAKING CHANGES (optional). Use "|" to break new line:\n',
      footerPrefixesSelect: 'Resolve or reference one or more ISSUES (optional):',
      customFooterPrefix: 'Input ISSUES prefix:',
      footer: 'Provide ISSUE numbers (e.g. "PE-123")\n',
      generatingByAI: 'Generating your AI commit subject...',
      generatedSelectByAI: 'Select from these AI-generated subjects:',
      confirmCommit: 'Are you sure you want to proceed with the commit above?',
    },
    types: [
      {
        value: 'feat',
        name: 'feat:     A new feature or improvement to existing feature',
        emoji: ':sparkles:',
      },
      { value: 'fix', name: 'fix:      A fix for a customer-facing defect', emoji: ':bug:' },
      { value: 'docs', name: 'docs:     Documentation only changes', emoji: ':memo:' },
      { value: 'perf', name: 'perf:     A code change that improves performance', emoji: ':zap:' },
      {
        value: 'style',
        name: 'style:    Changes that do not affect the meaning of the code (formatting, etc)',
        emoji: ':lipstick:',
      },
      {
        value: 'refactor',
        name: 'refactor: A code change that neither fixes a bug nor adds a feature',
        emoji: ':recycle:',
      },
      {
        value: 'test',
        name: 'test:     Adding missing tests or correcting existing tests',
        emoji: ':white_check_mark:',
      },
      {
        value: 'build',
        name: 'build:    Changes that affect the build system or external dependencies',
        emoji: ':package:',
      },
      {
        value: 'deps',
        name: 'deps:     Changes to internal dependencies (upgrades, downgrades, etc)',
        emoji: ':package:',
      },
      {
        value: 'ci',
        name: 'ci:       Changes to our CI configuration files and scripts',
        emoji: ':ferris_wheel:',
      },
      {
        value: 'chore',
        name: "chore:    Other changes that don't modify src or test files",
        emoji: ':hammer:',
      },
      { value: 'revert', name: 'revert:   Reverts a previous commit', emoji: ':rewind:' },
    ],
    scopes: scopes.default,
    useEmoji: false,
    emojiAlign: 'center',
    useAI: false,
    aiNumber: 1,
    themeColorCode: '',
    allowCustomScopes: true,
    allowEmptyScopes: true,
    customScopesAlign: 'bottom',
    customScopesAlias: 'custom',
    emptyScopesAlias: 'empty',
    upperCaseSubject: false,
    markBreakingChangeMode: false,
    allowBreakingChanges: ['feat', 'fix', 'perf'],
    breaklineNumber: 100,
    breaklineChar: '|',
    skipQuestions: [],
    issuePrefixes: [
      {
        value: 'References',
        name: "Reference: This commit references one or more ISSUES but doesn't resolve them.",
      },
      { value: 'Resolves', name: 'Resolve:   This commit resolves one or more ISSUES.' },
    ],
    customIssuePrefixAlign: 'top',
    emptyIssuePrefixAlias: 'skip',
    customIssuePrefixAlias: 'custom',
    allowCustomIssuePrefix: false,
    allowEmptyIssuePrefix: true,
    confirmColorize: true,
    defaultBody: '',
    defaultIssues: !issue ? '' : `${issue}`,
    defaultScope: '',
    defaultSubject: '',
    useCommitSignGPG: true,
  },
  plugins: ['selective-scope'],
}

export default Configuration
