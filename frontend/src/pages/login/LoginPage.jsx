import BackgroundWrapper from '../../components/BackgroundWrapper'
import Login from './Login'

export default function LoginPage() {
  return (
    <BackgroundWrapper
      contentClassName="w-full max-w-[400px]"
      paddingClassName="p-4 sm:p-6"
    >
      <Login />
    </BackgroundWrapper>
  )
}
