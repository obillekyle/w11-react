import { Container, Tabs, Toolbar } from '@ui/application';
import { useApplication } from '@ui/window';

const test2 = {
  id: 'com.test',
  name: 'Test',
  icon: '/assets/application/settings_gear.svg',
  children: <App />,
};

function App() {
  const app = useApplication();

  return (
    <div>
      <Container>
        <Toolbar
          options={{
            file: {
              show: true,
              submenu: [
                {
                  type: 'item',
                  label: 'Save As...',
                  onClick: () => app.close(),
                },
              ],
            },
            wow: {
              show: true,
              submenu: [],
            },
          }}
        />
        <Tabs
          tabs={[
            { label: 'Home', element: <div> hi</div> },
            {
              label: 'Tab 2',
              element: <div>Tab 2 yay</div>,
            },
          ]}
        />
      </Container>
    </div>
  );
}

export default test2;
