import Sky from './Sky.jsx'
import { Ground, Water } from './Terrain.jsx'
import Nature from './Nature.jsx'
import Castle from './Castle.jsx'
import Ranch from './Ranch.jsx'
import Village from './Village.jsx'
import Structures from './Structures.jsx'
import Rupees from './Rupees.jsx'
import Fairy from './Fairy.jsx'

export default function World() {
  return (
    <>
      <Sky />
      <Ground />
      <Water />
      <Nature />
      <Structures />
      <Castle />
      <Ranch />
      <Village />
      <Rupees />
      <Fairy />
    </>
  )
}
