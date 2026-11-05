import { Icon } from '../../ui/Icon.tsx'
import { Segmented } from '../../ui/Segmented.tsx'
import { setSceneLayout, useSceneLayout } from './sceneLayout.ts'

export function LayoutToggle({ className }: { className?: string }) {
  const layout = useSceneLayout((s) => s.layout)
  return (
    <Segmented
      label="Layout"
      value={layout}
      onChange={setSceneLayout}
      className={className}
      options={[
        {
          value: 'tiles',
          title: 'Show as tiles',
          label: (
            <>
              <Icon name="tiles" className="h-4 w-4" />
              <span className="sr-only">Tiles</span>
            </>
          ),
        },
        {
          value: 'list',
          title: 'Show as a list',
          label: (
            <>
              <Icon name="list" className="h-4 w-4" />
              <span className="sr-only">List</span>
            </>
          ),
        },
      ]}
    />
  )
}
