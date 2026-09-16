import { fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { NumberField, ShowMath } from '@/components/ui';

describe('shared controls', () => {
  it('parses numeric input and exposes its label', async () => {
    const onChange = jest.fn();
    const screen = await render(<NumberField label="Vehicle price" value={30000} onChange={onChange} />);
    await fireEvent.changeText(screen.getByLabelText('Vehicle price'), '$31,500');
    expect(onChange).toHaveBeenCalledWith(31500);
  });

  it('reveals formula details on demand', async () => {
    const screen = await render(<ShowMath><Text>Exact formula</Text></ShowMath>);
    expect(screen.queryByText('Exact formula')).toBeNull();
    await fireEvent.press(screen.getByText('Show math'));
    expect(screen.getByText('Exact formula')).toBeTruthy();
  });
});
