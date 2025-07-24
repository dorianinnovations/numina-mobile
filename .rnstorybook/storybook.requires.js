/* do not change this file as it is auto-generated. */
import {
  configure,
  addDecorator,
  addParameters,
} from '@storybook/react-native';

import { withKnobs } from '@storybook/addon-knobs';

addDecorator(withKnobs);

addParameters({
  backgrounds: [
    { name: 'dark', value: '#222222', default: true },
    { name: 'white', value: '#FFFFFF' },
  ],
});

// Import stories
configure(() => {
  require('../src/components/AnimatedGradientBorder.stories');
  require('../src/components/DevTools.stories');
  require('../src/components/ChromaticCard.stories');
  require('../src/components/BorderThemeSelector.stories');
}, module);