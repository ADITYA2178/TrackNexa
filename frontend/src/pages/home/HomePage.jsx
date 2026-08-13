import BackgroundWrapper from '../../components/BackgroundWrapper'
import HomeScreen from './HomeScreen'

export default function HomePage() {
  return (
    <BackgroundWrapper
      className="items-stretch overflow-x-clip"
      contentClassName="min-h-dvh w-full max-w-none"
      paddingClassName="p-0"
    >
      <HomeScreen />
    </BackgroundWrapper>
  )
}
