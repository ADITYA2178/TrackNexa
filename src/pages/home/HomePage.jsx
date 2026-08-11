import BackgroundWrapper from '../../components/BackgroundWrapper'
import HomeScreen from './HomeScreen'

export default function HomePage() {
  return (
    <BackgroundWrapper contentClassName="h-screen w-full max-w-none" paddingClassName="p-0">
      <HomeScreen />
    </BackgroundWrapper>
  )
}
