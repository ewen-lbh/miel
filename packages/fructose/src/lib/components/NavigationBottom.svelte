<script lang="ts">
  import ButtonNavigation from '$lib/components/ButtonNavigation.svelte';
  import { route } from '$lib/ROUTES';
  import IconCalendar from '~icons/msl/calendar-month';
  import IconCalendarOutline from '~icons/msl/calendar-today-outline';
  import IconHome from '~icons/msl/home';
  import IconHomeOutline from '~icons/msl/home-outline';
  import IconSearch from '~icons/msl/search';
  import IconDotsCircle from '~icons/msl/widgets';
  import IconDotsCircleOutline from '~icons/msl/widgets-outline';

  // export let me: NavigationBottomMe | null;
  // $: data = fragment(
  //   me,
  //   graphql(`
  //     fragment NavigationBottomMe on User {
  //       uid
  //     }
  //   `),
  // );
</script>

<nav>
  <ButtonNavigation
    href={route('/')}
    routeID="/(app)"
    label="Accueil"
    icon={IconHomeOutline}
    iconFilled={IconHome}
  />

  <ButtonNavigation
    href={route('/search')}
    routeID="/(app)/search/[[q]]"
    label="Clubs"
    icon={IconSearch}
    iconFilled={IconSearch}
  />
  <ButtonNavigation
    href={route('/events')}
    routeID="/(app)/events/[[week=date]]"
    label="Événements"
    icon={IconCalendarOutline}
    iconFilled={IconCalendar}
  />

  <ButtonNavigation
    href={route('/services')}
    routeID="/(app)/services"
    label="Services"
    icon={IconDotsCircleOutline}
    iconFilled={IconDotsCircle}
  />

  
</nav>

<style>
  nav {
    z-index: 101;
    display: flex;
    gap: 1rem;
    align-items: center;
    justify-content: space-evenly;
    width: 100%;
    height: 4rem;
    font-size: 1.5rem;
    background: var(--nav-bottom-background, var(--bg));
    background-repeat: repeat-x;
    background-size: auto 100%;
    border-top: var(--border-block) solid rgb(0 0 0 / 5%);
    view-transition-name: navigation-bottom;
  }

  @media (min-width: 900px) {
    nav {
      display: none;
    }
  }
</style>
