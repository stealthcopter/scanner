import type { Preset } from "shared";
import { computed, ref } from "vue";

import { useConfigService } from "@/services/config";

export const useCheckPresets = () => {
  const configService = useConfigService();

  const showNewPresetDialog = ref(false);
  const newPresetName = ref("");
  const menu = ref();
  const selectedPreset = ref<Preset>();

  const deletePreset = async (name: string) => {
    const configState = configService.getState();
    if (configState.type !== "Success") return;

    const { config } = configState;
    const updatedPresets = config.presets.filter((p) => p.name !== name);

    const update = {
      presets: updatedPresets,
    };

    await configService.updateConfig(update);
  };

  const menuModel = ref([
    {
      label: "Delete",
      icon: "fas fa-trash",
      command: () => {
        if (selectedPreset.value) {
          deletePreset(selectedPreset.value.name);
        }
      },
    },
  ]);

  const onPresetContextMenu = (event: MouseEvent, preset: Preset) => {
    selectedPreset.value = preset;
    menu.value.show(event);
  };

  const handleNewPreset = () => {
    showNewPresetDialog.value = true;
    newPresetName.value = "";
  };

  const saveCurrentAsPreset = async (name: string) => {
    const configState = configService.getState();
    if (configState.type !== "Success") return;

    const { config } = configState;
    const newPreset: Preset = {
      name,
      active: [...config.active.overrides],
      passive: [...config.passive.overrides],
    };

    const existingPresets = config.presets.filter((p) => p.name !== name);
    const updatedPresets = [...existingPresets, newPreset];

    const update = {
      presets: updatedPresets,
    };

    await configService.updateConfig(update);
  };

  const handleSaveNewPreset = async () => {
    if (newPresetName.value.trim()) {
      await saveCurrentAsPreset(newPresetName.value.trim());
      showNewPresetDialog.value = false;
      newPresetName.value = "";
    }
  };

  const handleCancelNewPreset = () => {
    showNewPresetDialog.value = false;
    newPresetName.value = "";
  };

  const getPresets = () => {
    const configState = configService.getState();
    if (configState.type !== "Success") return [];
    return configState.config.presets;
  };

  const presets = computed(() => getPresets());

  const applyPreset = async (preset: Preset) => {
    const configState = configService.getState();
    if (configState.type !== "Success") return;

    const update = {
      passive: {
        overrides: preset.passive,
      },
      active: {
        overrides: preset.active,
      },
    };

    await configService.updateConfig(update);
  };

  return {
    showNewPresetDialog,
    newPresetName,
    menu,
    menuModel,
    presets,
    handleNewPreset,
    handleSaveNewPreset,
    handleCancelNewPreset,
    onPresetContextMenu,
    applyPreset,
  };
};
