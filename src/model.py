
from torchvision.transforms import GaussianBlur
from torchvision.transforms import ToTensor
from torchvision.transforms.functional import to_pil_image, affine

# import legacy
# import dnnlib

import torch
import numpy as np

from utils import base64_to_pil_image, pil_image_to_base64

from PIL import Image

# from training.training_loop import Preprocess

network_pkl = '/notebooks/flask-runs/lhq-t-blur-3/00000-pix2stylegan3-t-lhq-512x512-half-gpus1-batch32-gamma8/network-snapshot-006080.pkl'


classifier_path = {
    "L3_52_512": {
        "idx": 3,
        "path": None,
        "bottleneck": 32
    },
    "L4_84_512": {
        "idx": 4,
        "path": None,
        "bottleneck": 32
    },
    "L5_84_512": {
        "idx": 5,
        "path": None,
        "bottleneck": 32
    },
    "L6_148_362": {
        "idx": 6,
        "path": None,
        "bottleneck": 32
    },
    "L7_148_242": {
        "idx": 7,
        "path": None,
        "bottleneck": 16
    }
}


class Pipeline(torch.nn.Module):

   def __init__(self, in_size = 256, out_size = 512):
       super().__init__()
       self.out_size = out_size
       self.in_size = in_size
       device = torch.device('cuda')
       self.device = device
       self.convert_tensor = ToTensor()
       self.configs = {
           "angle": 0,
           "translateX": 0,
           "translateY": 0,
           "scale": 1,
           "erosion": 0,
           "dilation": 0,
           "cluster": []
       }
      #  with dnnlib.util.open_url(network_pkl) as f:
      #     self.g_model = legacy.load_network_pkl(f)['G'].eval().requires_grad_(False).to(device)
      # #  self.g_model = None
      #  self.z = torch.from_numpy(np.random.randn(1, 512)).to(device)
       # self.initialise_plugins()
      #  self.pre_process = Preprocess().to(device)
      #  self.num_clusters = 5

   # def initialise_plugins(self):
   #    #  img = torch.zeros((1,3,self.in_size,self.in_size)).to(self.device)
   #     img = Image.open('/notebooks/54596.png').resize((256,256)).convert("RGB")
   #     img_tensor = self.convert_tensor(img).to(self.device).unsqueeze(0)*2-1

   #     _ = self.g_model(self.z, None, img_tensor)
   #     # _ = self.g_model.generate_cluster_for_layer(4, 32, '/content/classifierL4_52_1024_5.pt', img_tensor)

   #     for classifier in classifier_path:
   #        _ = self.g_model.generate_cluster_for_layer(classifier_path[classifier]["idx"],
   #                                                    classifier_path[classifier]["bottleneck"],
   #                                                    classifier_path[classifier]["path"],
   #                                                    img_tensor,
   #                                                    num_clusters = 5)

       # _ = self.g_model.generate_cluster_for_layer(5, 12, '/notebooks/pix2styleGAN3_backup/temp-runs/00004-pix2stylegan3-r-ffhq-u-256x256-gpus1-batch32-gamma2/classifierL5_84_512_3.pt', img_tensor, num_clusters = 5)

   # def regenerate_cluster(self, layer_name, img, num_of_clusters = 5, cur_cluster_selection = 0):
   #     img = base64_to_pil_image(img)
   #     img_tensor = self.convert_tensor(img).to(self.device).unsqueeze(0)*2-1
   #     img = self.g_model.generate_cluster_for_layer(classifier_path[layer_name]["idx"],
   #                                                   classifier_path[layer_name]["bottleneck"],
   #                                                   classifier_path[layer_name]["path"],
   #                                                   img_tensor,
   #                                                   num_clusters = num_of_clusters,
   #                                                   cur_cluster_selection = cur_cluster_selection)
   #     self.num_clusters = num_of_clusters
   #     grids = []
   #     for i in range(self.num_clusters):
   #        print(len(img))
   #        grids.append(pil_image_to_base64(img[i], quality = 40))
   #     return grids

   # def update_configs(self, name, config):
   #     # self.configs = c
   #     # print(f'{name} updated')
   #     self.g_model.synthesis.update_op(name, config)

   # def get_cluster_demo(self, layer_name, cluster_numbers, img):
   #     img = base64_to_pil_image(img)
   #     img = self.convert_tensor(img).to(self.device).unsqueeze(0)*2-1

   #    #  img = img[:,0].unsqueeze(1)
   #    #  img = to_pil_image(img.add(1).div(2).clamp(0, 1)[0].cpu())
   #     img = self.g_model.generate_cluster_demo(0, layer_name, img)

   #     grids = []
   #     for i in range(cluster_numbers):
   #        print(len(img))
   #        grids.append(pil_image_to_base64(img[i], quality = 40))

   #     return grids

   #     return pil_image_to_base64(img, quality = 40)

   # def get_layer_names(self, start = 3, end = 7):
   #     if self.g_model is not None:
   #         return self.g_model.synthesis.layer_names[start:end+1]
   #     else:
   #         return ['L4_52_1024', 'L5_84_724']

   def forward(self, img):
       '''
       parameter:
           img: PIL Image
       return:
           PIL Image

       '''
       # img = self.convert_tensor(img).to(self.device).unsqueeze(0)*2-1

       # img = self.pre_process.preprocess_to_conditions(img)
       # img = self.g_model(None, None, img, execute_op = True)

       # img = torch.nn.functional.interpolate(img, size=(self.out_size,self.out_size))
       # img = torch.nn.functional.interpolate(img, scale_factor=1)

       # return to_pil_image(img.add(1).div(2).clamp(0, 1)[0].cpu())
       return img




#--------------------------------------------




# class Pipeline(torch.nn.Module):

#    def __init__(self, kernel_size = 5, out_size = 512):
#        super().__init__()
#        self.out_size = out_size
#        self.blur = GaussianBlur(kernel_size, sigma=1)
#        self.convert_tensor = ToTensor()
#        self.configs = {
#                   "angle": 0,
#                   "translateX": 0,
#                   "translateY": 0,
#                   "scale": 1,
#                   "erosion": 0,
#                   "dilation": 0,
#                   "cluster": []
#               }
#        self.g_model = None
#        self.num_clusters = 5

#    def update_configs(self, name, c):
#        self.configs = c

#    def get_cluster_demo(self, layer_name, img):
#        img = base64_to_pil_image(img)
#        img = self.convert_tensor(img).unsqueeze(0)*2-1
#        img = img[:,0].unsqueeze(1)

#        grids = []
#        for i in range(self.num_clusters):
#           grids.append(pil_image_to_base64(to_pil_image(img.add(1).div(2).clamp(0, 1)[0]), quality = 40))

#        return grids

#    def get_layer_names(self):
#        if self.g_model is not None:
#            return self.g_model.get_layer_names()
#        else:
#            return ['L4_52_1024', 'L5_84_724', 'L6_148_1024']

#    def forward(self, img):
#        '''
#        parameter:
#            img: PIL Image
#        return:
#            PIL Image

#        '''
#        return img

#    def regenerate_cluster(self, layer_name, img, num_of_clusters = 5, cur_cluster_selection = 0):
#        self.num_clusters = num_of_clusters
#        return self.get_cluster_demo(layer_name,img)